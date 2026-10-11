"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  Check,
  X,
  MessageSquare,
  ArrowRight,
  Store,
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

export default function CustomerServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reportedPaymentAmount, setReportedPaymentAmount] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [clockNow, setClockNow] = useState(Date.now());

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
    void Promise.resolve().then(fetchRequests);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const handleQuoteDecision = async (requestId: string, decision: "Accepted" | "Declined", quoteExpiresAt: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          quoteStatus: decision,
          quoteExpiresAt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportPayment = async (orderId: string, remainingAmount: number) => {
    setActionLoading(orderId);
    try {
      const response = await fetch("/api/service-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "report_payment", amount: Number(reportedPaymentAmount) || remainingAmount }),
      });
      if (response.ok) {
        setReportedPaymentAmount("");
        await fetchRequests();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCustomerReview = async (orderId: string, status: "satisfied" | "request_changes") => {
    setActionLoading(orderId);
    try {
      const response = await fetch("/api/service-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "customer_review", status, reviewNote }),
      });
      if (response.ok) {
        setReviewNote("");
        await fetchRequests();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getOrderProgress = (order: any) => {
    if (["Review in Progress", "Completed"].includes(order.status)) return 100;
    if (!order.workStartedAt || !order.deliveryDueAt) return 0;
    const started = new Date(order.workStartedAt).getTime();
    const due = new Date(order.deliveryDueAt).getTime();
    if (due <= started) return 100;
    return Math.max(0, Math.min(99, Math.floor(((clockNow - started) / (due - started)) * 100)));
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#008060]" />
            Ecommerce Service Requests
          </h1>
          <p className="text-xs text-[#6d7175] mt-0.5">
            Track implementation progress, review engineering quotes, and communicate with your assigned Shopify architect.
          </p>
        </div>

        <Link
          href="/customer/services"
          className="bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" /> Request New Service
        </Link>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading service requests...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-[#e1e3e5] rounded-xl p-12 text-center shadow-2xs">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-gray-700">No active service requests</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Browse our catalog to request store redesigns, conversion rate optimization, or technical support.
          </p>
          <Link
            href="/customer/services"
            className="mt-4 inline-flex items-center gap-1.5 bg-[#008060] text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            Explore Catalog Services <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => {
            const currentStageIndex = STAGES.indexOf(req.status);
            const quoteExpired = req.quoteExpired === true;
            return (
              <div
                key={req.id}
                className="bg-white border border-[#e1e3e5] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md">
                      {req.requestCode}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-[#202223]">
                        {req.service?.name || "Shopify Store Service"}
                      </h2>
                      <div className="text-xs text-[#6d7175] flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#008060]" />
                        <span>{req.storeUrl || "Storefront"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        req.status === "In Progress"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : req.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : req.status === "Quoted"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {req.status}
                    </span>

                    <Link
                      href={req.conversationId ? `/customer/messages?conversationId=${encodeURIComponent(req.conversationId)}` : "/customer/messages"}
                      className="text-xs font-semibold text-[#008060] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat with Agent
                    </Link>
                  </div>
                </div>

                {/* VISUAL TIMELINE PROGRESS BAR */}
                <div>
                  <div className="text-xs font-semibold text-[#6d7175] mb-2 flex items-center justify-between">
                    <span>Workflow Progress Timeline</span>
                    <span className="text-[11px] text-[#008060] font-bold">
                      Current Stage: {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
                    {STAGES.slice(0, 8).map((stg, idx) => {
                      const isCompleted = currentStageIndex > idx;
                      const isCurrent = currentStageIndex === idx;
                      return (
                        <div
                          key={stg}
                          className={`p-2 rounded-lg text-center transition ${
                            isCompleted
                              ? "bg-emerald-50 border border-emerald-200 text-[#004c3f]"
                              : isCurrent
                              ? "bg-blue-600 text-white font-bold shadow-xs animate-pulse"
                              : "bg-gray-50 border border-gray-100 text-gray-400"
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wider font-semibold">
                            {isCompleted ? "✓ " : `${idx + 1}. `}
                            {stg}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Description and Details */}
                <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-semibold text-gray-700">Project Requirements:</div>
                  <p className="text-gray-600 leading-relaxed">{req.description}</p>
                  {req.goals && (
                    <div className="pt-1 text-gray-500">
                      <strong>Goals:</strong> {req.goals}
                    </div>
                  )}
                </div>

                {/* Formal Quote Card (if quoted or approved) */}
                {req.quotePrice && (
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                          Engineering Proposal & Scope
                        </div>
                        <div className="text-lg font-black text-purple-900 mt-0.5">
                          ${req.quotePrice} USD
                          <span className="text-xs font-medium text-purple-700 ml-2">
                            • Estimated delivery: {req.quoteTimeline}
                          </span>
                        </div>
                        {req.quoteBillingInterval && <div className="mt-1 text-xs font-semibold text-purple-800">Recurring billing: {req.quoteBillingInterval}</div>}
                        <p className="text-xs text-purple-800 mt-1">
                          Terms: {req.quoteTerms || "Milestone review on staging theme, final approval before live deployment."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.order ? (
                          <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                            <Check className="w-4 h-4 text-emerald-600" />
                            Order {req.order.orderCode} placed
                          </div>
                        ) : req.quoteStatus === "Accepted" || req.status === "Approved" || req.status === "In Progress" ? (
                          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                            Quote approved
                          </div>
                        ) : req.quoteStatus === "Declined" ? (
                          <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">Quote declined</div>
                        ) : quoteExpired ? (
                          <div className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Quote expired</div>
                        ) : req.quoteStatus === "Sent" && req.quoteExpiresAt ? (
                          <>
                            <button
                              onClick={() => handleQuoteDecision(req.id, "Accepted", req.quoteExpiresAt)}
                              disabled={actionLoading === req.id}
                              className="bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Quote
                            </button>
                            <button
                              onClick={() => handleQuoteDecision(req.id, "Declined", req.quoteExpiresAt)}
                              disabled={actionLoading === req.id}
                              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">Awaiting a valid quote</div>
                        )}
                      </div>

                      {req.order && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                          <div className="font-bold">Order {req.order.orderCode} · ${req.order.amount} {req.order.currency}</div>
                          <div className="mt-1">Status: {req.order.status} · Paid: ${req.order.amountPaid || 0} / ${req.order.amount} {req.order.currency}</div>
                          {req.order.status === "In Progress" && (
                            <div className="mt-3">
                              <div className="mb-1 flex justify-between text-[10px]"><span>Estimated timeline</span><span>{getOrderProgress(req.order)}%</span></div>
                              <div className="h-2 overflow-hidden rounded-full bg-amber-200"><div className="h-full bg-[#008060] transition-[width]" style={{ width: `${getOrderProgress(req.order)}%` }} /></div>
                              <p className="mt-1 text-[10px]">Target completion: {req.order.deliveryDueAt ? new Date(req.order.deliveryDueAt).toLocaleDateString() : "Being scheduled"}</p>
                            </div>
                          )}
                          {(["unpaid", "partial"].includes(req.order.paymentStatus) || req.order.recurringPaymentDue) && ["Awaiting Payment", "Ready to Start", "In Progress", "Awaiting Final Payment"].includes(req.order.status) && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <input type="number" min="1" value={reportedPaymentAmount} onChange={(event) => setReportedPaymentAmount(event.target.value)} placeholder={`Amount due: ${req.order.recurringPaymentDue ? req.order.amount : Math.max(req.order.amount - (req.order.amountPaid || 0), 0)}`} className="w-36 rounded-md border border-amber-300 bg-white px-2 py-1.5" />
                              <button onClick={() => handleReportPayment(req.order.id, req.order.recurringPaymentDue ? req.order.amount : Math.max(req.order.amount - (req.order.amountPaid || 0), 0))} disabled={actionLoading === req.order.id} className="rounded-md bg-amber-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50">
                                {actionLoading === req.order.id ? "Submitting..." : "I have paid"}
                              </button>
                            </div>
                          )}
                          {req.order.paymentStatus === "reported" && <p className="mt-2">Payment reported; your agent must confirm it before work begins.</p>}
                          {req.order.status === "Review in Progress" && <div className="mt-3 space-y-2 border-t border-amber-200 pt-3"><div className="font-semibold">Review the completed project in chat, then choose:</div><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={2} placeholder="Describe any changes you need" className="w-full rounded-md border border-amber-300 bg-white px-2 py-1.5"/><div className="flex flex-wrap gap-2"><button onClick={() => handleCustomerReview(req.order.id, "satisfied")} disabled={actionLoading === req.order.id} className="rounded-md bg-emerald-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Satisfied</button><button onClick={() => handleCustomerReview(req.order.id, "request_changes")} disabled={actionLoading === req.order.id} className="rounded-md border border-amber-700 px-3 py-1.5 font-semibold text-amber-900 disabled:opacity-50">Request changes</button></div></div>}
                          {req.order.status === "Awaiting Final Payment" && <p className="mt-2 font-semibold">You approved the completed work. Report the remaining payment to finish the order.</p>}
                          {req.order.status === "Completed" && <p className="mt-2 font-semibold text-emerald-800">Project accepted and order complete.</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
