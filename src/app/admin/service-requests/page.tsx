"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Sparkles, Store, CheckCircle2 } from "lucide-react";

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/service-requests")
      .then((res) => res.json())
      .then((data) => {
        if (data.requests) setRequests(data.requests);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-purple-400" />
          Service Requests & Delivery Control ({requests.length})
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          High-level tracking of active Shopify store redesigns, conversion audits, and speed optimizations.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">Request Code</th>
              <th className="p-3.5">Merchant</th>
              <th className="p-3.5">Service Offering</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Quote</th>
              <th className="p-3.5">Assigned Specialist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono font-bold text-white">{r.requestCode}</td>
                <td className="p-3.5">
                  <div className="font-bold text-white">{r.customer?.businessName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{r.customer?.customerCode}</div>
                </td>
                <td className="p-3.5 font-semibold text-slate-200">{r.service?.name}</td>
                <td className="p-3.5">
                  <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {r.status}
                  </span>
                </td>
                <td className="p-3.5 font-mono text-emerald-400 font-bold">
                  {r.quotePrice ? `$${r.quotePrice} USD` : "Pending Quote"}
                </td>
                <td className="p-3.5 text-slate-400">
                  {r.assignedAgent ? `${r.assignedAgent.fullName} (${r.assignedAgent.agentCode})` : "Unassigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
