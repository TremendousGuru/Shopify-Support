import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, customers, agents, users, messages } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let list: any[] = [];

    if (user.role === "customer" && user.customer) {
      list = await db
        .select()
        .from(conversations)
        .where(eq(conversations.customerId, user.customer.id))
        .orderBy(desc(conversations.lastMessageAt));
    } else if (user.role === "agent" && user.agent) {
      list = await db
        .select()
        .from(conversations)
        .where(eq(conversations.assignedAgentId, user.agent.id))
        .orderBy(desc(conversations.lastMessageAt));
    } else if (["system_admin", "support_supervisor", "data_privacy_admin"].includes(user.role)) {
      list = await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
    }

    // Attach last message preview and participant details
    const enriched = await Promise.all(
      list.map(async (conv) => {
        const [lastMsg] = await db
          .select()
          .from(messages)
          .where(and(eq(messages.conversationId, conv.id), eq(messages.isInternalNote, false)))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const [cust] = await db
          .select({
            customerCode: customers.customerCode,
            businessName: customers.businessName,
          })
          .from(customers)
          .where(eq(customers.id, conv.customerId))
          .limit(1);

        const [assignedAgent] = conv.assignedAgentId
          ? await db
              .select({ fullName: users.fullName, department: agents.department })
              .from(agents)
              .innerJoin(users, eq(users.id, agents.userId))
              .where(eq(agents.id, conv.assignedAgentId))
              .limit(1)
          : [];

        return {
          ...conv,
          customer: cust,
          assignedAgent: assignedAgent || null,
          lastMessage: lastMsg || null,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "customer" || !user.customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject = "General Support" } = body;

    const [conv] = await db
      .insert(conversations)
      .values({
        type: "support",
        customerId: user.customer.id,
        assignedAgentId: user.customer.assignedAgentId || null,
        subject: subject.trim(),
        isSensitive: true,
        status: "active",
      })
      .returning();

    return NextResponse.json({ success: true, conversation: conv });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
