import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, users, stores, agents, tickets, serviceRequests } from "@/db/schema";
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

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (supportStatus) updateData.supportStatus = supportStatus;
    if (assignedAgentId !== undefined) updateData.assignedAgentId = assignedAgentId || null;

    const [updated] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, customerId))
      .returning();

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
