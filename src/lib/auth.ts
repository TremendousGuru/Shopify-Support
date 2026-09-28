import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions, customers, agents } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "shop_support_session";

// Hash passwords securely using PBKDF2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return key === hash;
  } catch {
    return false;
  }
}

// Generate customer ID in format: SHOP-CUST-XXXXXX
export function generateCustomerCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `SHOP-CUST-${num}`;
}

// Generate agent ID in format: SHOP-AGENT-XXX
export function generateAgentCode(nextSeq: number): string {
  const seqStr = String(nextSeq).padStart(3, "0");
  return `SHOP-AGENT-${seqStr}`;
}

// Generate secure random token
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

// Create session and set cookie
export async function createSession(userId: string) {
  const sessionToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await db.insert(sessions).values({
    sessionToken,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return sessionToken;
}

// Destroy session
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

// Get current session user
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const [activeSession] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.sessionToken, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!activeSession) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, activeSession.userId))
    .limit(1);

  if (!user || !user.isActive) return null;

  let customerData = null;
  let agentData = null;

  if (user.role === "customer") {
    const [c] = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);
    customerData = c || null;
  } else if (user.role === "agent") {
    const [a] = await db.select().from(agents).where(eq(agents.userId, user.id)).limit(1);
    agentData = a || null;
  }

  return {
    ...user,
    customer: customerData,
    agent: agentData,
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// Granular role permission checker
export function checkPermission(
  user: { role: string; id: string },
  permission: string,
  context?: { targetCustomerId?: string; targetAgentId?: string }
): boolean {
  const { role } = user;

  // System Admin and Super roles
  if (role === "system_admin") {
    if (permission === "admin.view_sensitive_customer_data") {
      // Sensitive customer conversation requires explicit audit logging & supervisor privilege
      return true;
    }
    return true;
  }

  if (role === "support_supervisor") {
    if (permission.startsWith("agent.") || permission.startsWith("customer.view") || permission === "admin.view_sensitive_customer_data") {
      return true;
    }
    if (["admin.manage_tickets", "admin.manage_assignments", "admin.view_audit_logs"].includes(permission)) {
      return true;
    }
  }

  if (role === "data_privacy_admin") {
    if (permission === "admin.view_audit_logs" || permission === "admin.view_sensitive_customer_data") {
      return true;
    }
  }

  // Agent permissions
  if (role === "agent") {
    const agentAllowed = [
      "agent.view_assigned_customers",
      "agent.view_assigned_conversations",
      "agent.send_messages",
      "agent.create_internal_notes",
      "agent.update_tickets",
      "agent.update_service_requests",
      "agent.view_customer_files",
    ];
    return agentAllowed.includes(permission);
  }

  // Customer permissions
  if (role === "customer") {
    const customerAllowed = [
      "customer.view_own_profile",
      "customer.edit_own_profile",
      "customer.view_own_conversations",
      "customer.send_messages",
      "customer.create_ticket",
      "customer.create_service_request",
      "customer.upload_files",
    ];
    return customerAllowed.includes(permission);
  }

  return false;
}
