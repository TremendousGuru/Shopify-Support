import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents, users, agentInvitations, customers, tickets, serviceRequests, serviceOrders, conversations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["system_admin", "support_supervisor", "data_privacy_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allAgents = await db.select().from(agents).orderBy(desc(agents.createdAt));

    const enriched = await Promise.all(
      allAgents.map(async (ag) => {
        const [u] = await db.select().from(users).where(eq(users.id, ag.userId)).limit(1);
        const assignedCusts = await db.select().from(customers).where(eq(customers.assignedAgentId, ag.id));
        const assignedTkts = await db.select().from(tickets).where(eq(tickets.assignedAgentId, ag.id));

        return {
          ...ag,
          user: u ? { fullName: u.fullName, email: u.email, phone: u.phone, isActive: u.isActive } : null,
          assignedCustomersCount: assignedCusts.length,
          activeTicketsCount: assignedTkts.filter((t) => t.status !== "Closed" && t.status !== "Resolved").length,
        };
      })
    );

    const pendingInvites = await db
      .select()
      .from(agentInvitations)
      .orderBy(desc(agentInvitations.createdAt));

    return NextResponse.json({
      agents: enriched,
      invitations: pendingInvites,
      canManageAgents: user.role === "system_admin",
    });
  } catch (error: any) {
    console.error("Admin agents error:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "system_admin") {
      return NextResponse.json({ error: "Only System Admin can revoke invitations" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("inviteId");
    const body = await request.clone().json().catch(() => ({}));

    if (body.agentId) {
      const { agentId } = body;
      const replacementAgentId = body.replacementAgentId || null;

      const [targetAgent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
      if (!targetAgent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      const [replacementAgent] = replacementAgentId
        ? await db.select().from(agents).where(eq(agents.id, replacementAgentId)).limit(1)
        : [];
      const [replacementUser] = replacementAgent
        ? await db.select().from(users).where(eq(users.id, replacementAgent.userId)).limit(1)
        : [];

      if (
        (replacementAgentId && (!replacementAgent || !replacementUser?.isActive || replacementAgent.status === "Terminated" || replacementAgent.id === targetAgent.id))
      ) {
        return NextResponse.json({ error: "Choose a different active agent for reassignment" }, { status: 400 });
      }

      if (targetAgent.status === "Terminated") {
        return NextResponse.json({ error: "This agent has already been terminated" }, { status: 409 });
      }

      const nextAgentId = replacementAgent?.id || null;

      await db.transaction(async (tx) => {
        await tx
          .update(customers)
          .set({ assignedAgentId: nextAgentId, updatedAt: new Date() })
          .where(eq(customers.assignedAgentId, targetAgent.id));

        await tx
          .update(tickets)
          .set({ assignedAgentId: nextAgentId, updatedAt: new Date() })
          .where(eq(tickets.assignedAgentId, targetAgent.id));

        await tx
          .update(serviceRequests)
          .set({ assignedAgentId: nextAgentId, updatedAt: new Date() })
          .where(eq(serviceRequests.assignedAgentId, targetAgent.id));

        await tx
          .update(serviceOrders)
          .set({ assignedAgentId: nextAgentId, updatedAt: new Date() })
          .where(eq(serviceOrders.assignedAgentId, targetAgent.id));

        await tx
          .update(conversations)
          .set({ assignedAgentId: nextAgentId })
          .where(eq(conversations.assignedAgentId, targetAgent.id));

        await tx.update(agents).set({ status: "Terminated" }).where(eq(agents.id, targetAgent.id));
        await tx.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, targetAgent.userId));
      });

      await recordAuditLog({
        actorId: user.id,
        actorRole: user.role,
        actorName: user.fullName,
        action: "TERMINATE_AGENT",
        targetType: "agent",
        targetId: targetAgent.id,
        reason: replacementAgent
          ? `Terminated agent and reassigned active merchant and case coverage to replacement agent ${replacementAgent.id}`
          : "Terminated agent and left merchant and case coverage unassigned for later reassignment",
      });

      return NextResponse.json({ success: true, terminatedAgentId: targetAgent.id, replacementAgentId: nextAgentId });
    }

    if (!inviteId) {
      return NextResponse.json({ error: "inviteId is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(agentInvitations)
      .set({ status: "revoked" })
      .where(eq(agentInvitations.id, inviteId))
      .returning();

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorName: user.fullName,
      action: "REVOKE_AGENT_INVITATION",
      targetType: "agent_invitation",
      targetId: inviteId,
      reason: "Invitation revoked by System Admin",
    });

    return NextResponse.json({ success: true, invitation: updated });
  } catch (error: any) {
    console.error("Error revoking invite:", error);
    return NextResponse.json({ error: "Failed to revoke invitation" }, { status: 500 });
  }
}
