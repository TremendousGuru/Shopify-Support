import { NextResponse } from "next/server";
import { db } from "@/db";
import { agentInvitations, users, agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser, generateSecureToken } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["system_admin", "support_supervisor"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { email, department, role = "agent" } = body;

    if (!email) {
      return NextResponse.json({ error: "Agent email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Check existing pending invitation
    const [existingInvite] = await db
      .select()
      .from(agentInvitations)
      .where(eq(agentInvitations.email, cleanEmail))
      .orderBy(desc(agentInvitations.createdAt))
      .limit(1);

    if (existingInvite && existingInvite.status === "pending" && existingInvite.expiresAt > new Date()) {
      return NextResponse.json({
        success: true,
        message: "An active invitation already exists for this email",
        invitationToken: existingInvite.token,
        inviteUrl: `/start/agent?token=${existingInvite.token}`,
      });
    }

    // Generate secure expiring token (valid for 48 hours)
    const token = generateSecureToken(24);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48);

    const [invite] = await db
      .insert(agentInvitations)
      .values({
        email: cleanEmail,
        department: department?.trim() || "Shopify Merchant Support",
        role,
        invitedBy: currentUser.id,
        token,
        status: "pending",
        expiresAt,
      })
      .returning();

    // Record audit log
    await recordAuditLog({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      actorName: currentUser.fullName,
      action: "INVITE_AGENT",
      targetType: "agent_invitation",
      targetId: invite.id,
      reason: `Invited new support agent for ${department || "Merchant Support"}`,
      metadata: { invitedEmail: cleanEmail, role },
    });

    return NextResponse.json({
      success: true,
      invitationId: invite.id,
      invitationToken: token,
      inviteUrl: `/start/agent?token=${token}`,
      expiresAt,
    });
  } catch (error: any) {
    console.error("Agent invitation error:", error);
    return NextResponse.json({ error: "Failed to create agent invitation" }, { status: 500 });
  }
}
