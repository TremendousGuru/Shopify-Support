"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Headphones,
  CheckCircle2,
  Trash2,
  Copy,
  Clock,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function AdminAgentsPage() {
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [department, setDepartment] = useState("Shopify Theme & Merchant Architecture");
  const [inviting, setInviting] = useState(false);
  const [terminatingAgentId, setTerminatingAgentId] = useState<string | null>(null);
  const [replacementAgentById, setReplacementAgentById] = useState<Record<string, string>>({});
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentsAndInvites = async () => {
    try {
      const res = await fetch("/api/admin/agents");
      const data = await res.json();
      if (data.agents) setAgentsList(data.agents);
      if (data.invitations) setInvites(data.invitations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsAndInvites();
  }, []);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    setCreatedInviteUrl(null);

    try {
      const res = await fetch("/api/admin/invite-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          department,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create invitation");
      }

      setCreatedInviteUrl(data.inviteUrl);
      fetchAgentsAndInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/admin/agents?inviteId=${inviteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAgentsAndInvites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAgentSignupLink = async (agentId: string) => {
    try {
      const response = await fetch("/api/admin/agent-signup-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create signup link");
      copyToClipboard(data.path);
    } catch (err: any) {
      setError(err.message || "Could not create signup link");
    }
  };

  const handleTerminateAgent = async (agentId: string) => {
    const replacementAgentId = replacementAgentById[agentId];
    if (!replacementAgentId) {
      setError("Choose a replacement agent before terminating this account.");
      return;
    }

    setTerminatingAgentId(agentId);
    setError(null);

    try {
      const res = await fetch("/api/admin/agents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, replacementAgentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to terminate agent");
      }

      fetchAgentsAndInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTerminatingAgentId(null);
    }
  };

  const activeAgents = agentsList.filter((agent) => agent.status !== "Terminated");

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border border-[#e5e5e5] bg-white p-5 shadow-[0_1px_0_rgba(17,24,39,0.02)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.03em] text-[#202223] flex items-center gap-2">
            <Headphones className="w-5 h-5 text-[#5E8E3E]" />
            Support Agents & Invitations
          </h1>
          <p className="text-xs text-[#6b7280] mt-1">
            Administer support team members. Open registration is blocked — only invited personnel can activate accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setCreatedInviteUrl(null);
            setError(null);
          }}
          className="bg-[#95BF47] hover:bg-[#5E8E3E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Invite New Agent
        </button>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#e5e5e5] bg-white shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="p-4 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-bold text-[#4a4d52] uppercase tracking-wider">
            Active Support Specialists ({agentsList.length})
          </h2>
        </div>

        <div className="divide-y divide-[#e5e5e5]">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#6b7280]">Loading agents...</div>
          ) : activeAgents.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6b7280]">No agents registered.</div>
          ) : (
            activeAgents.map((ag) => (
              <div
                key={ag.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fafafa] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold bg-[#eef6df] text-[#5E8E3E] border border-[#d7e7b8] px-2 py-0.5 rounded">
                      {ag.agentCode}
                    </span>
                    <span className="text-sm font-bold text-[#202223]">{ag.user?.fullName}</span>
                    <span className="text-xs text-[#6b7280]">({ag.user?.email})</span>
                  </div>
                  <div className="text-xs text-[#5E8E3E]">{ag.department}</div>
                  <div className="text-[11px] text-[#6b7280]">
                    Specialties: <span className="text-[#4a4d52]">{ag.specialties}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex items-center gap-4 shrink-0 text-xs text-[#6b7280]">
                    <div className="bg-[#f6f6f7] px-3 py-1.5 rounded-lg border border-[#e5e5e5]">
                      Assigned: <strong className="text-[#202223]">{ag.assignedCustomersCount}</strong> merchants
                    </div>
                    <div className="bg-[#f6f6f7] px-3 py-1.5 rounded-lg border border-[#e5e5e5]">
                      Active Tickets: <strong className="text-[#5E8E3E]">{ag.activeTicketsCount}</strong>
                    </div>
                    <span className="text-[#5E8E3E] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {ag.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyAgentSignupLink(ag.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#dfe3e8] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#202223] hover:bg-[#f6f6f7]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Link copied" : "Copy signup link"}
                    </button>
                    <select
                      value={replacementAgentById[ag.id] || ""}
                      onChange={(e) =>
                        setReplacementAgentById((current) => ({
                          ...current,
                          [ag.id]: e.target.value,
                        }))
                      }
                      className="w-44 rounded-lg border border-[#dfe3e8] bg-[#f6f6f7] px-2.5 py-1.5 text-[11px] text-[#202223] focus:outline-none focus:ring-2 focus:ring-[#95BF47]/30"
                    >
                      <option value="">Select replacement</option>
                      {agentsList
                        .filter((agent) => agent.id !== ag.id && agent.status !== "Terminated")
                        .map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.user?.fullName} ({agent.agentCode})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleTerminateAgent(ag.id)}
                      disabled={terminatingAgentId === ag.id || !replacementAgentById[ag.id]}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {terminatingAgentId === ag.id ? "Terminating..." : "Terminate"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[22px] border border-[#e5e5e5] bg-white shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="p-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5E8E3E]" />
            <h2 className="text-xs font-bold text-[#4a4d52] uppercase tracking-wider">
              Agent Invitations Queue ({invites.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Invited Email</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Expires</th>
                <th className="p-3.5">Invite Link</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No pending invitations.
                  </td>
                </tr>
              ) : (
                invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white">{inv.email}</td>
                    <td className="p-3.5 text-slate-400">{inv.department}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          inv.status === "pending"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : inv.status === "accepted"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-red-950 text-red-300 border border-red-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(inv.expiresAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      {inv.status === "pending" && (
                        <button
                          onClick={() => copyToClipboard(`/start/agent?token=${inv.token}`)}
                          className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Copy className="w-3 h-3" /> Copy Link
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {inv.status === "pending" && (
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Revoke invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1">Invite Support Specialist</h2>
            <p className="text-xs text-slate-400 mb-4">
              Generates an expiring invitation token. Only the recipient can activate an agent account.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-red-950 text-red-300 border border-red-800 rounded-lg text-xs">
                {error}
              </div>
            )}

            {createdInviteUrl ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300">
                  <div className="font-bold mb-1">Invitation Link Generated!</div>
                  <div className="font-mono text-[11px] bg-slate-950 p-2 rounded break-all border border-slate-800 text-slate-200">
                    {typeof window !== "undefined" ? window.location.origin : ""}{createdInviteUrl}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(createdInviteUrl)}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied!" : "Copy Invitation URL"}
                  </button>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-slate-700 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Specialist Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="agent.name@shopifyhub.com"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department / Focus
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option>Shopify Theme & Merchant Architecture</option>
                    <option>Checkout Extensibility & CRO</option>
                    <option>Technical Speed & Core Web Vitals</option>
                    <option>General Merchant Triage</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3.5 py-2 border border-slate-700 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition"
                  >
                    {inviting ? "Generating..." : "Generate Secure Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
