import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, agents, agentInvitations } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { hashPassword, generateAgentCode, createSession } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, fullName, password, phone, specialties } = body;

    if (!token || !fullName || !password) {
      return NextResponse.json(
        { error: "Token, full name, and password are required" },
        { status: 400 }
      );
    }

    // 1. Verify invitation token
    const [invitation] = await db
      .select()
      .from(agentInvitations)
      .where(eq(agentInvitations.token, token.trim()))
      .limit(1);

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation token. Access denied." }, { status: 403 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status}.` },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      await db.update(agentInvitations).set({ status: "expired" }).where(eq(agentInvitations.id, invitation.id));
      return NextResponse.json({ error: "This invitation token has expired. Please contact an admin." }, { status: 400 });
    }

    // 2. Check if user already exists
    const [existing] = await db.select().from(users).where(eq(users.email, invitation.email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    // 3. Calculate sequential Agent ID (Format: SHOP-AGENT-001, SHOP-AGENT-002, etc.)
    const totalAgentsResult = await db.select({ value: count() }).from(agents);
    const totalAgents = Number(totalAgentsResult[0]?.value || 0);
    const agentCode = generateAgentCode(totalAgents + 1);

    // 4. Create User
    const [newUser] = await db
      .insert(users)
      .values({
        email: invitation.email,
        passwordHash: hashPassword(password),
        fullName: fullName.trim(),
        role: "agent",
        phone: phone?.trim() || null,
        isActive: true,
        isEmailVerified: true,
      })
      .returning();

    // 5. Create Agent Record
    const [newAgent] = await db
      .insert(agents)
      .values({
        userId: newUser.id,
        agentCode,
        department: invitation.department || "Shopify Merchant Support",
        specialties: specialties?.trim() || "Shopify Liquid, Theme Customization, Store Operations",
        status: "Available",
      })
      .returning();

    // 6. Mark invitation accepted
    await db
      .update(agentInvitations)
      .set({ status: "accepted" })
      .where(eq(agentInvitations.id, invitation.id));

    // 7. Record Audit Log
    await recordAuditLog({
      actorId: newUser.id,
      actorRole: "agent",
      actorName: newUser.fullName,
      action: "AGENT_ONBOARDED",
      targetType: "agent",
      targetId: newAgent.id,
      reason: `Agent onboarded with code ${agentCode} via valid admin invitation`,
    });

    // 8. Establish Session
    await createSession(newUser.id);

    return NextResponse.json({
      success: true,
      agentCode,
      agent: newAgent,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Agent onboarding error:", error);
    return NextResponse.json({ error: "Failed to onboard agent" }, { status: 500 });
  }
}

// GET to verify token validity before showing onboarding form
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
  }

  const [invitation] = await db
    .select()
    .from(agentInvitations)
    .where(eq(agentInvitations.token, token.trim()))
    .limit(1);

  if (!invitation) {
    return NextResponse.json({ valid: false, error: "Invitation not found" }, { status: 404 });
  }

  if (invitation.status !== "pending") {
    return NextResponse.json({ valid: false, error: `Invitation already ${invitation.status}` }, { status: 400 });
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ valid: false, error: "Invitation has expired" }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    email: invitation.email,
    department: invitation.department,
  });
}
