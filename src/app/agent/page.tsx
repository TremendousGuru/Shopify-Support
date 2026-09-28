import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { customers, agents, tickets, serviceRequests, conversations, users } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import {
  Headphones,
  Users,
  Ticket,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  StickyNote,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const agent = user.agent;

  // Query assigned customers
  const assignedCustomers = agent
    ? await db
        .select()
        .from(customers)
        .where(eq(customers.assignedAgentId, agent.id))
        .orderBy(desc(customers.createdAt))
    : [];

  // Query tickets assigned to agent or open
  const agentTickets = agent
    ? await db
        .select()
        .from(tickets)
        .where(or(eq(tickets.assignedAgentId, agent.id), eq(tickets.status, "Open")))
        .orderBy(desc(tickets.createdAt))
        .limit(6)
    : [];

  // Query service requests assigned to agent or submitted
  const agentRequests = agent
    ? await db
        .select()
        .from(serviceRequests)
        .where(or(eq(serviceRequests.assignedAgentId, agent.id), eq(serviceRequests.status, "Submitted")))
        .orderBy(desc(serviceRequests.createdAt))
        .limit(6)
    : [];

  const urgentTickets = agentTickets.filter(
    (t) => (t.priority === "Urgent" || t.priority === "High") && t.status !== "Closed"
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-950 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-800 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              Specialist Workspace
            </span>
            <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2 py-0.5 rounded-full">
              {agent?.agentCode || "SHOP-AGENT-001"}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome, {user.fullName}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Department: <strong>{agent?.department || "Merchant Architecture"}</strong>. Ready to triage tickets and review store service requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/agent/conversations"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" /> Live Chat Inbox
          </Link>
          <Link
            href="/agent/tickets"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
          >
            Triage Queue
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Assigned Merchants</div>
          <div className="text-2xl font-bold text-white mt-1">{assignedCustomers.length}</div>
          <div className="text-[11px] text-blue-400 mt-1">
            Max capacity: {agent?.maxAssignedCustomers || 25}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Active Tickets</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {agentTickets.filter((t) => t.status !== "Closed" && t.status !== "Resolved").length}
          </div>
          <div className="text-[11px] text-red-400 mt-1">
            {urgentTickets.length} High/Urgent
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Service Deliveries</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{agentRequests.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">In progress & review</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Agent Status</div>
          <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {agent?.status || "Available"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Accepting conversations</div>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Tickets Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white">Tickets Requiring Action</h2>
            </div>
            <Link
              href="/agent/tickets"
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              View Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {agentTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active tickets in queue.
              </div>
            ) : (
              agentTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold bg-slate-700 text-slate-200 px-2 py-0.5 rounded">
                      {t.ticketCode}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        t.priority === "Urgent"
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : t.priority === "High"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-blue-950 text-blue-300 border border-blue-800"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 line-clamp-1">{t.subject}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{t.description}</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status: <strong className="text-slate-200">{t.status}</strong></span>
                    <Link
                      href={`/agent/tickets`}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Triage →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Service Requests Workflow */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Ecommerce Service Requests</h2>
            </div>
            <Link
              href="/agent/service-requests"
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              All Requests <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {agentRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active service requests.
              </div>
            ) : (
              agentRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold bg-slate-700 text-slate-200 px-2 py-0.5 rounded">
                      {req.requestCode}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {req.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 line-clamp-1">{req.description}</h3>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-medium">
                      {req.quotePrice ? `Quote: $${req.quotePrice} USD` : "Needs Quote"}
                    </span>
                    <Link
                      href={`/agent/service-requests`}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Manage Workflow →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
