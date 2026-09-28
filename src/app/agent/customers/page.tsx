"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Store,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Ticket,
  ClipboardList,
} from "lucide-react";

export default function AgentCustomersPage() {
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.customers) {
          setCustomersList(data.customers);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = customersList.filter(
    (c) =>
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.user?.fullName && c.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Assigned Merchants & Stores
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View authorized merchant details, connected storefronts, and open support tickets.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, brand, or name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-500">
            Loading assigned merchants...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-500">
            No merchants found matching your query.
          </div>
        ) : (
          filtered.map((cust) => (
            <div
              key={cust.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                      {cust.customerCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {cust.supportStatus}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">{cust.businessName}</h3>
                  <div className="text-xs text-slate-400">
                    Merchant: {cust.user?.fullName} ({cust.user?.email})
                  </div>
                </div>

                <Link
                  href="/agent/conversations"
                  className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition"
                  title="Open Chat with Merchant"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>
              </div>

              {cust.websiteUrl && (
                <div className="bg-slate-800/60 rounded-lg p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-slate-300 truncate">{cust.websiteUrl}</span>
                  </div>
                  <a
                    href={cust.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-800">
                <div className="bg-slate-800/40 p-2 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Open Tickets</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {cust.openTicketsCount ?? 0}
                  </span>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Service Requests</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {cust.serviceRequestsCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
