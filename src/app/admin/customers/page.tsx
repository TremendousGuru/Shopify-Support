"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  ShieldAlert,
  Lock,
  MessageSquare,
  Store,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Privacy Checkpoint Modal State
  const [privacyModalCustomer, setPrivacyModalCustomer] = useState<any | null>(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [accessLogged, setAccessLogged] = useState(false);
  const [loggingAccess, setLoggingAccess] = useState(false);
  const [customerMessages, setCustomerMessages] = useState<any[]>([]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/agents");
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([fetchCustomers(), fetchAgents()]));
  }, []);

  const handleUpdateStatus = async (customerId: string, supportStatus: string) => {
    try {
      await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, supportStatus }),
      });
      fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignAgent = async (customerId: string, assignedAgentId: string) => {
    setAssignmentError(null);
    try {
      const response = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, assignedAgentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reassign this customer.");
      fetchCustomers();
    } catch (e) {
      console.error(e);
      setAssignmentError(e instanceof Error ? e.message : "Could not reassign this customer.");
    }
  };

  // PRIVACY CHECKPOINT: Audit log must be recorded before administrator can inspect private customer conversation
  const handleOpenPrivacyCheckpoint = (cust: any) => {
    setPrivacyModalCustomer(cust);
    setEscalationReason("");
    setAccessLogged(false);
    setCustomerMessages([]);
  };

  const handleConfirmAuditedAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyModalCustomer || escalationReason.trim().length < 5) return;

    setLoggingAccess(true);
    try {
      // 1. Record Audit Checkpoint in database
      const auditRes = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: privacyModalCustomer.id,
          customerCode: privacyModalCustomer.customerCode,
          reason: escalationReason.trim(),
        }),
      });

      if (auditRes.ok) {
        setAccessLogged(true);

        // 2. Fetch conversation
        const convRes = await fetch(`/api/conversations`);
        const convData = await convRes.json();
        const customerConv = (convData.conversations || []).find(
          (c: any) => c.customerId === privacyModalCustomer.id
        );

        if (customerConv) {
          const msgRes = await fetch(`/api/messages?conversationId=${customerConv.id}`);
          const msgData = await msgRes.json();
          setCustomerMessages(msgData.messages || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingAccess(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.user?.fullName && c.user.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border border-[#e5e5e5] bg-white p-5 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold tracking-[-0.03em] text-[#202223] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#5E8E3E]" />
              Merchant Accounts & Governance
            </h1>
            <p className="text-xs text-[#6b7280] mt-1">
              Manage merchant accounts, update statuses, assign agents, and perform audited operational reviews.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#6b7280] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchants..."
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#f6f6f7] border border-[#e5e5e5] rounded-lg text-[#202223] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#95BF47]/30"
            />
          </div>
        </div>
      </div>

      {assignmentError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{assignmentError}</p>}
      <div className="overflow-hidden rounded-[22px] border border-[#e5e5e5] bg-white shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#4a4d52]">
            <thead className="bg-[#fafafa] text-[#6b7280] uppercase tracking-wider text-[10px] border-b border-[#e5e5e5]">
              <tr>
                <th className="p-3.5">Customer Code</th>
                <th className="p-3.5">Brand & Owner</th>
                <th className="p-3.5">Storefront</th>
                <th className="p-3.5">Support Status</th>
                <th className="p-3.5">Assigned Agent</th>
                <th className="p-3.5 text-right">Privacy Checkpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6b7280]">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6b7280]">
                    No merchants found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fafafa]">
                    <td className="p-3.5 font-mono font-bold text-[#5E8E3E] whitespace-nowrap">
                      {c.customerCode}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#202223]">{c.businessName}</div>
                      <div className="text-[11px] text-[#6b7280]">
                        {c.user?.fullName} ({c.user?.email})
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-[#6b7280]">
                      {c.websiteUrl || "nordicglow.myshopify.com"}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={c.supportStatus}
                        onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                        className="bg-[#f6f6f7] border border-[#dfe3e8] text-xs text-[#202223] rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#95BF47]/30"
                      >
                        <option value="Activated">Activated</option>
                        <option value="Issued">Issued</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={c.assignedAgentId || ""}
                        onChange={(e) => handleAssignAgent(c.id, e.target.value)}
                        className="bg-[#f6f6f7] border border-[#dfe3e8] text-xs text-[#202223] rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#95BF47]/30"
                      >
                        <option value="">Unassigned</option>
                        {agents.filter((ag) => ag.status !== "Terminated" && ag.user?.isActive).map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.user?.fullName} ({ag.agentCode})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenPrivacyCheckpoint(c)}
                        className="bg-[#eef6df] hover:bg-[#e6f3d1] border border-[#d7e7b8] text-[#5E8E3E] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#5E8E3E]" />
                        <span>Inspect Chat (Audited)</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRIVACY CHECKPOINT MODAL (MANDATORY REQUIREMENT) */}
      {privacyModalCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-400">
                <Lock className="w-5 h-5" />
                <h2 className="text-base font-bold text-white">
                  Privacy Access Checkpoint
                </h2>
              </div>
              <button
                onClick={() => setPrivacyModalCustomer(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {!accessLogged ? (
              <form onSubmit={handleConfirmAuditedAccess} className="mt-4 space-y-4">
                <div className="p-3.5 bg-amber-950/40 border border-amber-800 rounded-xl text-xs text-amber-200 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Customer Privacy Notice: Unrestricted access prohibited
                  </div>
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    This support conversation contains private merchant communications belonging to{" "}
                    <strong>{privacyModalCustomer.businessName}</strong> ({privacyModalCustomer.customerCode}). Your administrative role permits access only when a valid operational justification is provided and logged.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Operational Reason for Access <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="e.g. Investigating high-priority checkout glitch reported in escalation ticket..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    * This action, timestamp, actor ID, and reason will be permanently recorded in the Audit Log.
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPrivacyModalCustomer(null)}
                    className="px-4 py-2 border border-slate-700 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loggingAccess || escalationReason.trim().length < 5}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    {loggingAccess ? "Recording Audit Log..." : "Log Reason & View Transcript"}
                  </button>
                </div>
              </form>
            ) : (
              /* Audited Access Granted -> Transcript Display */
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Access authorized & logged permanently under your Admin ID.</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                    Audited
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 max-h-80 overflow-y-auto space-y-3 border border-slate-800">
                  {customerMessages.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No message history found for this customer.
                    </div>
                  ) : (
                    customerMessages.map((m) => (
                      <div key={m.id} className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-purple-300">
                            {m.senderName} ({m.senderRole})
                          </span>
                          <span>{new Date(m.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="bg-slate-900 p-2.5 rounded-lg text-slate-200 leading-relaxed border border-slate-800">
                          {m.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setPrivacyModalCustomer(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Close Transcript
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
