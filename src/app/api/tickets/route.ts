import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, conversations, customers, agents, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let queryTickets: any[] = [];

    if (user.role === "customer" && user.customer) {
      queryTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.customerId, user.customer.id))
        .orderBy(desc(tickets.createdAt));
    } else if (user.role === "agent" && user.agent) {
      queryTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.assignedAgentId, user.agent.id))
        .orderBy(desc(tickets.createdAt));
    } else if (["system_admin", "support_supervisor"].includes(user.role)) {
      queryTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Attach customer info & assigned agent info
    const enriched = await Promise.all(
      queryTickets.map(async (t) => {
        const [cust] = await db
          .select({
            customerCode: customers.customerCode,
            businessName: customers.businessName,
          })
          .from(customers)
          .where(eq(customers.id, t.customerId))
          .limit(1);

        let agentInfo = null;
        if (t.assignedAgentId) {
          const [ag] = await db
            .select({
              agentCode: agents.agentCode,
              userId: agents.userId,
            })
            .from(agents)
            .where(eq(agents.id, t.assignedAgentId))
            .limit(1);

          if (ag) {
            const [u] = await db
              .select({ fullName: users.fullName })
              .from(users)
              .where(eq(users.id, ag.userId))
              .limit(1);
            agentInfo = { ...ag, fullName: u?.fullName };
          }
        }

        return {
          ...t,
          customer: cust,
          assignedAgent: agentInfo,
        };
      })
    );

    return NextResponse.json({ tickets: enriched });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "customer" || !user.customer) {
      return NextResponse.json({ error: "Only authenticated customers can create tickets" }, { status: 403 });
    }

    const body = await request.json();
    const { subject, description, category, priority = "Normal", serviceRequestId } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `TKT-${randomNum}`;

    // 1. Create Ticket
    const [newTicket] = await db
      .insert(tickets)
      .values({
        ticketCode,
        customerId: user.customer.id,
        subject: subject.trim(),
        description: description.trim(),
        category: category || "Shopify Store Support",
        priority,
        status: "Open",
        assignedAgentId: user.customer.assignedAgentId || null,
        serviceRequestId: serviceRequestId || null,
      })
      .returning();

    // 2. Create underlying Conversation for Ticket
    const [conv] = await db
      .insert(conversations)
      .values({
        type: "ticket",
        customerId: user.customer.id,
        ticketId: newTicket.id,
        assignedAgentId: user.customer.assignedAgentId || null,
        subject: `Ticket ${ticketCode}: ${subject.trim()}`,
        isSensitive: true,
        status: "active",
      })
      .returning();

    // 3. Notify assigned agent or supervisor
    if (user.customer.assignedAgentId) {
      const [ag] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, user.customer.assignedAgentId))
        .limit(1);
      if (ag) {
        await sendNotification({
          userId: ag.userId,
          type: "TICKET_UPDATED",
          title: `New Ticket Created: ${ticketCode}`,
          body: `${user.customer.businessName} submitted: "${subject.trim()}"`,
          link: `/agent/tickets/${newTicket.id}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      conversationId: conv.id,
    });
  } catch (error: any) {
    console.error("Ticket creation error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, status, priority, assignedAgentId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    // Role check: Only agents and admins can update ticket status/agent
    if (!["agent", "system_admin", "support_supervisor"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: Agent access required" }, { status: 403 });
    }

    const [assignedTicket] = await db
      .select({ assignedAgentId: tickets.assignedAgentId })
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);
    if (!assignedTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (user.role === "agent" && assignedTicket.assignedAgentId !== user.agent?.id) {
      return NextResponse.json({ error: "Access denied to this ticket" }, { status: 403 });
    }
    if (user.role === "agent" && assignedAgentId !== undefined) {
      return NextResponse.json({ error: "Agents cannot reassign tickets" }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedAgentId !== undefined && user.role !== "agent") updateData.assignedAgentId = assignedAgentId;

    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

    if (!updatedTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Notify customer
    const [cust] = await db
      .select({ userId: customers.userId })
      .from(customers)
      .where(eq(customers.id, updatedTicket.customerId))
      .limit(1);

    if (cust) {
      await sendNotification({
        userId: cust.userId,
        type: "TICKET_UPDATED",
        title: `Ticket ${updatedTicket.ticketCode} Updated`,
        body: `Status updated to "${updatedTicket.status}" by support team.`,
        link: `/customer/tickets`,
      });
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
