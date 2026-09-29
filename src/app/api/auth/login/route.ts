import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession, getCurrentUser, destroySession } from "@/lib/auth";
import { getPortalHomeForRole } from "@/lib/portal-access";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, portal: expectedPortal } = body;

    if (!email || typeof password !== "string" || !password || !["/admin", "/agent", "/customer"].includes(expectedPortal)) {
      return NextResponse.json({ error: "Email, password, and a valid portal are required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Account not found with this email" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "This account has been deactivated" }, { status: 403 });
    }

    const isValid = user.passwordHash && verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const portal = getPortalHomeForRole(user.role);
    if (expectedPortal && portal !== expectedPortal) {
      return NextResponse.json({ error: "These credentials are not valid for this portal" }, { status: 403 });
    }

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      portal,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
