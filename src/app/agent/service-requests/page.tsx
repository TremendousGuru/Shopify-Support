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
  const [categories, setCategories] = useState<any[]>([]);
  const [catalogServices, setCatalogServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalSending, setProposalSending] = useState(false);
  const [proposalMessage, setProposalMessage] = useState<string | null>(null);
  const [proposal, setProposal] = useState({ categoryId: "", name: "", shortDescription: "", fullDescription: "", startingPrice: "", estimatedDays: "", features: "" });

  // Quote modal
  const [quoteReq, setQuoteReq] = useState<any | null>(null);
  const [quotePrice, setQuotePrice] = useState("1850");
  const [quoteTimeline, setQuoteTimeline] = useState("10-14 business days");
  const [quoteTerms, setQuoteTerms] = useState("50% upfront, milestone review on staging theme, 50% upon deployment.");
  const [savingQuote, setSavingQuote] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

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
    void Promise.resolve().then(() => {
      fetchRequests();
      return fetch("/api/services").then((response) => response.json()).then((data) => {
        const nextCategories = data.categories || [];
        setCategories(nextCategories);
        setCatalogServices(nextCategories.flatMap((category: any) => (category.services || []).map((service: any) => ({ ...service, categoryName: category.name }))));
        if (nextCategories[0]) setProposal((current) => ({ ...current, categoryId: nextCategories[0].id }));
      });
    }).catch(console.error);
  }, []);

  const handleSubmitProposal = async (event: React.FormEvent) => {
    event.preventDefault();
    setProposalSending(true);
    setProposalMessage(null);
    try {
      const response = await fetch("/api/service-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit proposal");
      setProposal((current) => ({ ...current, name: "", shortDescription: "", fullDescription: "", startingPrice: "", estimatedDays: "", features: "" }));
      setProposalMessage("Service proposal sent to the admin review queue.");
    } catch (error) {
      setProposalMessage(error instanceof Error ? error.message : "Could not submit proposal");
    } finally {
      setProposalSending(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string, orderId?: string) => {
    setStatusError(null);
    try {
      const deliveryStatus = ["In Progress", "Quality Review", "Completed", "Closed"].includes(status);
      const response = await fetch(deliveryStatus && orderId ? "/api/service-orders" : "/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryStatus && orderId
          ? { orderId, action: "update_status", status }
          : { requestId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update request status");
      await fetchRequests();
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Could not update request status");
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
      {statusError && <div role="alert" className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-200">{statusError}</div>}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-bold text-white">Request a new catalog service</h2>
        <p className="mt-1 text-xs text-slate-400">An administrator must approve it before customers can see or request it.</p>
        {proposalMessage && <div role="status" className="mt-3 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">{proposalMessage}</div>}
        <form onSubmit={handleSubmitProposal} className="mt-4 grid gap-3 md:grid-cols-2">
          <select required value={proposal.categoryId} onChange={(event) => setProposal({ ...proposal, categoryId: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">
            <option value="">Choose category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input required value={proposal.name} onChange={(event) => setProposal({ ...proposal, name: event.target.value })} placeholder="Service name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" />
          <input required value={proposal.shortDescription} onChange={(event) => setProposal({ ...proposal, shortDescription: event.target.value })} placeholder="Short description" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" min="0" value={proposal.startingPrice} onChange={(event) => setProposal({ ...proposal, startingPrice: event.target.value })} placeholder="Starting price (USD)" className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" />
            <input required value={proposal.estimatedDays} onChange={(event) => setProposal({ ...proposal, estimatedDays: event.target.value })} placeholder="Estimated days" className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" />
          </div>
          <textarea required rows={3} value={proposal.fullDescription} onChange={(event) => setProposal({ ...proposal, fullDescription: event.target.value })} placeholder="Full scope and deliverables" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white md:col-span-2" />
          <input value={proposal.features} onChange={(event) => setProposal({ ...proposal, features: event.target.value })} placeholder="Features, separated by commas" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white md:col-span-2" />
          <button disabled={proposalSending || !categories.length} className="justify-self-start rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{proposalSending ? "Submitting..." : "Submit for admin approval"}</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-bold text-white">Live service catalog</h2>
        <p className="mt-1 text-xs text-slate-400">Services published by the administrator and currently visible to customers.</p>
        {catalogServices.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-700 p-4 text-xs text-slate-500">No services are published yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalogServices.map((service) => (
              <article key={service.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">{service.categoryName}</p>
                <h3 className="mt-1 text-xs font-bold text-white">{service.name}</h3>
                <p className="mt-1 text-[11px] text-slate-400">{service.shortDescription}</p>
                <p className="mt-2 text-[11px] font-semibold text-slate-200">${service.startingPrice ?? 0} USD · {service.estimatedDays || "Timeline by agreement"}</p>
              </article>
            ))}
          </div>
        )}
      </section>

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
                    onChange={(e) => handleUpdateStatus(req.id, e.target.value, req.order?.id)}
                    className="bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                    {[...new Set([...STAGES.filter((stage) => !["Approved", "In Progress", "Quality Review", "Completed", "Closed"].includes(stage)), req.status, ...(req.order ? (req.order.status === "Ready to Start" ? ["In Progress"] : req.order.status === "In Progress" ? ["Quality Review", "Completed"] : req.order.status === "Quality Review" ? ["In Progress", "Completed"] : req.order.status === "Completed" ? ["Closed"] : []) : [])])].map((s) => (
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
