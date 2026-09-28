import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export interface AuditLogInput {
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  customerCode?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export async function recordAuditLog(input: AuditLogInput) {
  try {
    await db.insert(auditLogs).values({
      actorId: input.actorId,
      actorRole: input.actorRole,
      actorName: input.actorName,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      customerCode: input.customerCode || null,
      reason: input.reason || "Operational review",
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
