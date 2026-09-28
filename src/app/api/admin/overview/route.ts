import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, agents, tickets, serviceRequests, agentInvitations, auditLogs } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["system_admin", "support_supervisor", "data_privacy_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [totalCustRes] = await db.select({ val: count() }).from(customers);
    const [totalAgentsRes] = await db.select({ val: count() }).from(agents);
    const [openTicketsRes] = await db
      .select({ val: count() })
      .from(tickets)
      .where(eq(tickets.status, "Open"));
    const [inProgressTicketsRes] = await db
      .select({ val: count() })
      .from(tickets)
      .where(eq(tickets.status, "In Progress"));
    const [activeRequestsRes] = await db
      .select({ val: count() })
      .from(serviceRequests)
      .where(eq(serviceRequests.status, "In Progress"));
    const [pendingInvitesRes] = await db
      .select({ val: count() })
      .from(agentInvitations)
      .where(eq(agentInvitations.status, "pending"));

    const recentLogs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return NextResponse.json({
      stats: {
        totalCustomers: Number(totalCustRes?.val || 0),
        activeAgents: Number(totalAgentsRes?.val || 0),
        openTickets: Number(openTicketsRes?.val || 0),
        inProgressTickets: Number(inProgressTicketsRes?.val || 0),
        activeServiceRequests: Number(activeRequestsRes?.val || 0),
        pendingInvitations: Number(pendingInvitesRes?.val || 0),
      },
      recentAuditLogs: recentLogs,
    });
  } catch (error: any) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Failed to fetch overview data" }, { status: 500 });
  }
}
