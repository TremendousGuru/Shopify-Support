"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  DollarSign,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
} from "lucide-react";

const STAGES = [
  "Submitted",
  "Under Review",
  "Needs Information",
  "Quoted",
  "Approved",
  "In Progress",
  "Quality Review",
  "Completed",
  "Closed",
];

export default function AgentServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quote modal
  const [quoteReq, setQuoteReq] = useState<any | null>(null);
  const [quotePrice, setQuotePrice] = useState("1850");
  const [quoteTimeline, setQuoteTimeline] = useState("10-14 business days");
  const [quoteTerms, setQuoteTerms] = useState("50% upfront, milestone review on staging theme, 50% upon deployment.");
  const [savingQuote, setSavingQuote] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/service-requests");
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteReq) return;

    setSavingQuote(true);
    try {
      await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: quoteReq.id,
          quotePrice: Number(quotePrice),
          quoteTimeline,
          quoteTerms,
          quoteStatus: "Sent",
          status: "Quoted",
        }),
      });
      setQuoteReq(null);
      fetchRequests();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingQuote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-400" />
          Service Requests & Delivery Workflow
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review merchant service applications, issue quotes, and update delivery milestones.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading service requests...</div>
        ) : requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
            No service requests found.
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded">
                      {req.requestCode}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {req.service?.name || "Shopify Ecommerce Service"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Merchant: <strong className="text-slate-200">{req.customer?.businessName}</strong> ({req.customer?.customerCode})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={req.status}
                    onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setQuoteReq(req);
                      if (req.quotePrice) setQuotePrice(String(req.quotePrice));
                      if (req.quoteTimeline) setQuoteTimeline(req.quoteTimeline);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    {req.quotePrice ? "Edit Quote" : "Issue Quote"}
                  </button>
                </div>
              </div>

              {/* Requirement Text */}
              <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-300">
                <span className="font-semibold text-slate-400 block mb-1">Scope / Description:</span>
                <p className="leading-relaxed">{req.description}</p>
                {req.goals && (
                  <div className="mt-1 text-slate-400">
                    <strong>Goals:</strong> {req.goals}
                  </div>
                )}
              </div>

              {/* Quote info if present */}
              {req.quotePrice && (
                <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="text-purple-300 font-semibold">
                    Current Quote: ${req.quotePrice} USD • {req.quoteTimeline}
                    <span className="ml-2 text-[10px] bg-purple-900 px-2 py-0.5 rounded text-purple-200">
                      Status: {req.quoteStatus || "Sent"}
                    </span>
                  </div>
                  <span className="text-purple-400 text-[11px] truncate">{req.quoteTerms}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quote Modal */}
      {quoteReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1">
              Issue Official Quote for {quoteReq.requestCode}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter pricing and delivery timeframe for {quoteReq.customer?.businessName}.
            </p>

            <form onSubmit={handleSendQuote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Price (USD)
                </label>
                <input
                  type="number"
                  required
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estimated Delivery Timeline
                </label>
                <input
                  type="text"
                  required
                  value={quoteTimeline}
                  onChange={(e) => setQuoteTimeline(e.target.value)}
                  placeholder="e.g. 10 business days"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment & Delivery Terms
                </label>
                <textarea
                  rows={3}
                  value={quoteTerms}
                  onChange={(e) => setQuoteTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuoteReq(null)}
                  className="px-3.5 py-1.5 border border-slate-700 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuote}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition"
                >
                  {savingQuote ? "Sending Quote..." : "Send Quote to Merchant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
