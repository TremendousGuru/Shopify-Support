import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["system_admin", "support_supervisor", "data_privacy_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

    return NextResponse.json({ auditLogs: logs });
  } catch (error: any) {
    console.error("Audit logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["system_admin", "support_supervisor", "data_privacy_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, customerCode, conversationId, reason } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A valid operational reason (min 5 characters) is required to access sensitive customer data." },
        { status: 400 }
      );
    }

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorName: user.fullName,
      action: "VIEW_SENSITIVE_CUSTOMER_CONVERSATION",
      targetType: "conversation",
      targetId: conversationId || customerId,
      customerCode,
      reason: reason.trim(),
    });

    return NextResponse.json({ success: true, authorized: true });
  } catch (error: any) {
    console.error("Sensitive access logging error:", error);
    return NextResponse.json({ error: "Failed to record audit checkpoint" }, { status: 500 });
  }
}
