import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, users, stores, agents, tickets, serviceRequests, serviceOrders, conversations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["system_admin", "support_supervisor", "data_privacy_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt));

    const enriched = await Promise.all(
      allCustomers.map(async (c) => {
        const [u] = await db.select().from(users).where(eq(users.id, c.userId)).limit(1);
        const storeList = await db.select().from(stores).where(eq(stores.customerId, c.id));
        const ticketList = await db.select().from(tickets).where(eq(tickets.customerId, c.id));
        const requestList = await db.select().from(serviceRequests).where(eq(serviceRequests.customerId, c.id));

        let assignedAgent = null;
        if (c.assignedAgentId) {
          const [ag] = await db.select().from(agents).where(eq(agents.id, c.assignedAgentId)).limit(1);
          if (ag) {
            const [agUser] = await db.select().from(users).where(eq(users.id, ag.userId)).limit(1);
            assignedAgent = { ...ag, fullName: agUser?.fullName };
          }
        }

        return {
          ...c,
          user: u ? { fullName: u.fullName, email: u.email, phone: u.phone, isActive: u.isActive } : null,
          stores: storeList,
          openTicketsCount: ticketList.filter((t) => t.status !== "Closed" && t.status !== "Resolved").length,
          totalTicketsCount: ticketList.length,
          serviceRequestsCount: requestList.length,
          assignedAgent,
        };
      })
    );

    return NextResponse.json({ customers: enriched });
  } catch (error: any) {
    console.error("Admin customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["system_admin", "support_supervisor"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, supportStatus, assignedAgentId } = body;

    if (assignedAgentId !== undefined && user.role !== "system_admin") {
      return NextResponse.json({ error: "Only a system administrator can reassign customers" }, { status: 403 });
    }

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (supportStatus) updateData.supportStatus = supportStatus;
    if (assignedAgentId !== undefined) {
      if (assignedAgentId) {
        const [activeAgent] = await db
          .select({ id: agents.id, status: agents.status, isActive: users.isActive })
          .from(agents)
          .innerJoin(users, eq(users.id, agents.userId))
          .where(eq(agents.id, assignedAgentId))
          .limit(1);
        if (!activeAgent?.isActive || activeAgent.status === "Terminated") {
          return NextResponse.json({ error: "Choose an active agent" }, { status: 400 });
        }
      }
      updateData.assignedAgentId = assignedAgentId || null;
    }

    const [updated] = await db.transaction(async (tx) => {
      const [customer] = await tx
        .update(customers)
        .set(updateData)
        .where(eq(customers.id, customerId))
        .returning();

      if (customer && assignedAgentId !== undefined) {
        const nextAgentId = assignedAgentId || null;
        await tx.update(tickets).set({ assignedAgentId: nextAgentId, updatedAt: new Date() }).where(eq(tickets.customerId, customerId));
        await tx.update(serviceRequests).set({ assignedAgentId: nextAgentId, updatedAt: new Date() }).where(eq(serviceRequests.customerId, customerId));
        await tx.update(serviceOrders).set({ assignedAgentId: nextAgentId, updatedAt: new Date() }).where(eq(serviceOrders.customerId, customerId));
        await tx.update(conversations).set({ assignedAgentId: nextAgentId }).where(eq(conversations.customerId, customerId));
      }

      return [customer];
    });

    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorName: user.fullName,
      action: "UPDATE_CUSTOMER",
      targetType: "customer",
      targetId: customerId,
      customerCode: updated.customerCode,
      reason: `Updated status to ${supportStatus || "unchanged"}, agent assignment to ${assignedAgentId || "unassigned"}`,
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error("Admin update customer error:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
