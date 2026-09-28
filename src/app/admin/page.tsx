import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { customers, agents, tickets, serviceRequests, agentInvitations, auditLogs } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { ChevronRight, CheckCircle2, Clock3, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [custCount] = await db.select({ val: count() }).from(customers);
  const [agentCount] = await db.select({ val: count() }).from(agents);
  const [openTicketCount] = await db
    .select({ val: count() })
    .from(tickets)
    .where(eq(tickets.status, "Open"));
  const [activeReqCount] = await db
    .select({ val: count() })
    .from(serviceRequests)
    .where(eq(serviceRequests.status, "In Progress"));
  const [pendingInvites] = await db
    .select({ val: count() })
    .from(agentInvitations)
    .where(eq(agentInvitations.status, "pending"));

  const recentAudits = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(8);

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border border-[#e5e5e5] bg-white p-5 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5] mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5E8E3E]" />
            <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-[#202223]">Operational overview</h3>
          </div>
          <div className="text-xs text-[#6b7280]">Live metrics</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">
            <div className="text-[11px] text-[#6b7280]">Merchants</div>
            <div className="mt-2 text-[28px] font-semibold text-[#202223]">{custCount?.val || 0}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">
            <div className="text-[11px] text-[#6b7280]">Agents</div>
            <div className="mt-2 text-[28px] font-semibold text-[#202223]">{agentCount?.val || 0}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">
            <div className="text-[11px] text-[#6b7280]">Open tickets</div>
            <div className="mt-2 text-[28px] font-semibold text-[#202223]">{openTicketCount?.val || 0}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">
            <div className="text-[11px] text-[#6b7280]">In progress</div>
            <div className="mt-2 text-[28px] font-semibold text-[#202223]">{activeReqCount?.val || 0}</div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">
            <div className="text-[11px] text-[#6b7280]">Pending invites</div>
            <div className="mt-2 text-[28px] font-semibold text-[#202223]">{pendingInvites?.val || 0}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-[#e5e5e5] bg-white p-5 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="flex items-center gap-2 pb-3 border-b border-[#e5e5e5] mb-4">
          <Clock3 className="w-4 h-4 text-[#5E8E3E]" />
          <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-[#202223]">Recent audit trail</h3>
        </div>

        <div className="space-y-3">
          {recentAudits.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-3">
              <span className="mt-1 flex h-2.5 w-2.5 rounded-full bg-[#95BF47]" />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[12px] text-[#6b7280] flex-wrap">
                  <span className="font-semibold text-[#202223]">{log.actorName}</span>
                  <span className="rounded bg-[#eef6df] px-1.5 py-0.5 text-[#5E8E3E] font-medium">{log.action}</span>
                  <span className="capitalize">{log.actorRole.replace("_", " ")}</span>
                </div>
                <p className="mt-1 text-[13px] text-[#4a4d52]">{log.reason}</p>
              </div>
              <div className="text-right text-[11px] text-[#6b7280] whitespace-nowrap">
                {new Date(log.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
