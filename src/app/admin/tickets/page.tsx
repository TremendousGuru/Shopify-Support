"use client";

import { useState, useEffect } from "react";
import { Ticket, Search, Filter, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-purple-400" />
          Support Tickets Oversight ({tickets.length})
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Global platform tickets overview, priority tracking, and resolution monitoring.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">Ticket Code</th>
              <th className="p-3.5">Merchant</th>
              <th className="p-3.5">Subject</th>
              <th className="p-3.5">Priority</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Assigned Agent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono font-bold text-white">{t.ticketCode}</td>
                <td className="p-3.5">
                  <div className="font-bold text-white">{t.customer?.businessName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{t.customer?.customerCode}</div>
                </td>
                <td className="p-3.5 max-w-xs">
                  <div className="font-bold text-white truncate">{t.subject}</div>
                  <div className="text-[10px] text-slate-400 truncate">{t.description}</div>
                </td>
                <td className="p-3.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      t.priority === "Urgent"
                        ? "bg-red-950 text-red-300"
                        : t.priority === "High"
                        ? "bg-amber-950 text-amber-300"
                        : "bg-blue-950 text-blue-300"
                    }`}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-200">
                    {t.status}
                  </span>
                </td>
                <td className="p-3.5 text-slate-400">
                  {t.assignedAgent ? `${t.assignedAgent.fullName} (${t.assignedAgent.agentCode})` : "Unassigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
