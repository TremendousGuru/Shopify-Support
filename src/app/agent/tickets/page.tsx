"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Save,
} from "lucide-react";

export default function AgentTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    setUpdatingId(ticketId);
    try {
      await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status }),
      });
      fetchTickets();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.ticketCode.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.customer?.businessName && t.customer.businessName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            Support Tickets Triage Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Resolve merchant storefront bugs, app conflicts, and checkout issues.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Ticket Code</th>
                <th className="p-3.5">Merchant</th>
                <th className="p-3.5">Subject & Category</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading tickets...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No tickets found in queue.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                      {t.ticketCode}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-white">{t.customer?.businessName}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {t.customer?.customerCode}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-bold text-white truncate">{t.subject}</div>
                      <div className="text-[10px] text-slate-400 truncate">{t.category}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === "Urgent"
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : t.priority === "High"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-blue-950 text-blue-300 border border-blue-800"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                        disabled={updatingId === t.id}
                        className="bg-slate-800 border border-slate-700 text-xs text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting for Customer">Waiting for Customer</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Link
                        href="/agent/conversations"
                        className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Reply
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
