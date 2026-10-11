"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Clock,
  Headphones,
  User,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";
import { ChatAttachmentButton } from "@/components/shared/ChatAttachmentButton";

export default function CustomerMessagesPage() {
  const searchParams = useSearchParams();
  const linkedConversationId = searchParams.get("conversationId");
  const handledLinkId = useRef<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteActionId, setQuoteActionId] = useState<string | null>(null);
  const [reportedPaymentAmount, setReportedPaymentAmount] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [clockNow, setClockNow] = useState(Date.now());
  const [content, setContent] = useState<string>("");
  const [conversationSearch, setConversationSearch] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastDisplayedMessageId = useRef<string | null>(null);

  // Fetch conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        setSelectedConvId((current) =>
          (current && data.conversations.some((conversation: any) => conversation.id === current)
            ? current
            : data.conversations.find((conversation: any) => conversation.id === linkedConversationId)?.id)
            || data.conversations[0]?.id
            || null
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [linkedConversationId]);

  // Fetch messages for selected conversation
  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/service-orders");
      const data = await response.json();
      if (data.orders) setOrders(data.orders);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([loadConversations(), loadOrders()]));
  }, [loadConversations, loadOrders]);

  useEffect(() => {
    if (!linkedConversationId || linkedConversationId === handledLinkId.current || !conversations.some((conversation) => conversation.id === linkedConversationId)) return;
    handledLinkId.current = linkedConversationId;
    void Promise.resolve().then(() => setSelectedConvId(linkedConversationId));
  }, [linkedConversationId, conversations]);

  useEffect(() => {
    lastDisplayedMessageId.current = null;
  }, [selectedConvId]);

  useEffect(() => {
    if (selectedConvId) {
      void Promise.resolve().then(() => loadMessages(selectedConvId));
      // Real-time polling interval (every 4 seconds) to ensure real-time updates
      const timer = setInterval(() => {
        loadMessages(selectedConvId);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [selectedConvId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    const lastMessageId = messages.at(-1)?.id ?? null;
    if (!container || !lastMessageId || lastMessageId === lastDisplayedMessageId.current) return;

    const isInitialMessage = lastDisplayedMessageId.current === null;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    lastDisplayedMessageId.current = lastMessageId;

    // Only follow new messages when the customer is already near the bottom.
    // Polling refreshes must not interrupt someone reading older messages.
    if (isInitialMessage || isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: isInitialMessage ? "auto" : "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedConvId || sending) return;

    setSending(true);
    const textToSend = content;
    setMessageError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          content: textToSend,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Message could not be sent. Please try again.");
      setContent("");
      setMessages((prev) => [...prev, data.message]);
    } catch (e) {
      console.error(e);
      setMessageError(e instanceof Error ? e.message : "Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleQuoteDecision = async (requestId: string, quoteStatus: "Accepted" | "Declined", quoteExpiresAt: string) => {
    if (quoteActionId) return;
    setQuoteActionId(requestId);
    setQuoteError(null);
    try {
      const response = await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, quoteStatus, quoteExpiresAt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update this quote.");
      if (quoteStatus === "Accepted" && !data.order) throw new Error("Quote was accepted, but the order was not returned. Refresh the page or contact support.");
      if (data.order) setOrders((current) => [data.order, ...current.filter((order) => order.id !== data.order.id)]);
      await Promise.all([selectedConvId ? loadMessages(selectedConvId) : Promise.resolve(), loadOrders()]);
    } catch (error) {
      setQuoteError(error instanceof Error ? error.message : "Could not update this quote.");
    } finally {
      setQuoteActionId(null);
    }
  };

  const handleReportPayment = async (orderId: string, remainingAmount: number) => {
    const response = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "report_payment", amount: Number(reportedPaymentAmount) || remainingAmount }),
    });
    if (response.ok) {
      setReportedPaymentAmount("");
      await loadOrders();
    } else {
      const data = await response.json();
      setQuoteError(data.error || "Could not report payment.");
    }
  };

  const handleCustomerReview = async (orderId: string, status: "satisfied" | "request_changes") => {
    const response = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "customer_review", status, reviewNote }),
    });
    const data = await response.json();
    if (!response.ok) {
      setQuoteError(data.error || "Could not save your review.");
      return;
    }
    setReviewNote("");
    await loadOrders();
  };

  const getOrderProgress = (order: any) => {
    if (["Review in Progress", "Completed"].includes(order.status)) return 100;
    if (!order.workStartedAt || !order.deliveryDueAt) return 0;
    const started = new Date(order.workStartedAt).getTime();
    const due = new Date(order.deliveryDueAt).getTime();
    if (due <= started) return 100;
    return Math.max(0, Math.min(99, Math.floor(((clockNow - started) / (due - started)) * 100)));
  };

  const activeConv = conversations.find((c) => c.id === selectedConvId);
  const filteredConversations = conversations.filter((conversation) =>
    [conversation.subject, conversation.type, conversation.lastMessage?.content]
      .some((value) => String(value || "").toLowerCase().includes(conversationSearch.toLowerCase()))
  );

  return (
    <div className="bg-white border border-[#e1e3e5] rounded-2xl shadow-sm overflow-hidden flex min-h-0 flex-col md:flex-row h-[calc(100dvh-180px)] min-h-[400px] md:h-[calc(100dvh-140px)]">
      {/* Conversations List (Left Column) */}
      <div className="flex min-h-0 w-full flex-col border-r border-[#e1e3e5] bg-[#fbfbfb] md:w-80">
        <div className="p-4 border-b border-[#e1e3e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#008060]" />
            <h2 className="text-sm font-bold text-[#202223]">Support Conversations</h2>
          </div>
          <button
            onClick={() => loadConversations()}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Refresh conversations"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <label className="flex items-center gap-2 border-b border-[#e1e3e5] px-3 py-2 text-gray-400">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input aria-label="Search conversations" value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-xs text-[#202223] outline-none placeholder:text-gray-400" />
        </label>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              No conversations yet.
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">No conversations match your search.</div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.id === selectedConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`w-full text-left p-3.5 transition flex flex-col gap-1 ${
                    isSelected ? "bg-white border-l-4 border-[#008060] shadow-xs" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202223] truncate">
                      {c.subject || "Support Discussion"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-1">
                    {c.lastMessage?.content || "Click to open conversation..."}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-semibold uppercase bg-emerald-100 text-[#004c3f] px-1.5 py-0.2 rounded">
                      {c.type}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-[#008060]" /> Verified Support
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Chat Window (Right / Center) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#e1e3e5] flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#008060] font-bold text-xs flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#202223]">
                {activeConv?.subject || "Shopify Support Thread"}
              </div>
              <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Specialist {activeConv?.assignedAgent?.fullName || "assigned to your account"}
                {activeConv?.assignedAgent?.department ? ` (${activeConv.assignedAgent.department})` : null}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#008060]" />
            <span>Encrypted & Audited</span>
          </div>
        </div>

        {/* Message Stream */}
        <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 bg-[#f9fafb]">
          {quoteError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{quoteError}</div>}
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p>No messages yet. Send a message below to start chatting with your agent.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === "customer";
              let attachments: any[] = [];
              try {
                attachments = m.attachments ? JSON.parse(m.attachments) : [];
              } catch {
                attachments = [];
              }
              const order = m.serviceRecommendation
                ? orders.find((item) => item.serviceRequestId === m.serviceRecommendation.requestId)
                : null;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1 px-1">
                    <span className="font-semibold text-gray-600">{m.senderName}</span>
                    <span>•</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  <div
                    className={`max-w-md sm:max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                      isMe
                        ? "bg-[#008060] text-white rounded-br-xs"
                        : "bg-white text-[#202223] border border-[#e1e3e5] rounded-bl-xs"
                    }`}
                  >
                    {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                    {attachments.map((attachment) => (
                      <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 underline underline-offset-2">
                        {attachment.fileType?.startsWith("image/") ? <Image src={attachment.fileUrl} alt={attachment.fileName} width={640} height={480} unoptimized className="max-h-48 max-w-full rounded-md object-contain" /> : attachment.fileName}
                      </a>
                    ))}
                  </div>

                  {m.serviceRecommendation && (
                    <div className="mt-2 w-full max-w-lg rounded-lg border border-emerald-200 bg-white p-3 text-xs text-[#202223]">
                      <div className="font-bold">Service recommendation: {m.serviceRecommendation.serviceName}</div>
                      <div className="mt-1">Quote: ${m.serviceRecommendation.quotePrice} USD · {m.serviceRecommendation.quoteTimeline}</div>
                      {m.serviceRecommendation.quoteBillingInterval && <div className="mt-1 font-semibold text-amber-800">Recurring: {m.serviceRecommendation.quoteBillingInterval}</div>}
                      {m.serviceRecommendation.quoteTerms && <p className="mt-1 text-gray-600">{m.serviceRecommendation.quoteTerms}</p>}
                      {m.serviceRecommendation.quoteStatus === "Sent" && m.serviceRecommendation.quoteExpiresAt && !m.serviceRecommendation.quoteExpired ? (
                        <div className="mt-3 flex gap-2">
                          <button disabled={quoteActionId === m.serviceRecommendation.requestId} onClick={() => handleQuoteDecision(m.serviceRecommendation.requestId, "Accepted", m.serviceRecommendation.quoteExpiresAt)} className="rounded-md bg-[#008060] px-3 py-1.5 font-semibold text-white disabled:opacity-50">{quoteActionId === m.serviceRecommendation.requestId ? "Processing..." : "Approve and place order"}</button>
                          <button disabled={quoteActionId === m.serviceRecommendation.requestId} onClick={() => handleQuoteDecision(m.serviceRecommendation.requestId, "Declined", m.serviceRecommendation.quoteExpiresAt)} className="rounded-md border border-gray-300 px-3 py-1.5 font-semibold disabled:opacity-50">Decline</button>
                        </div>
                      ) : <div className="mt-2 font-semibold text-gray-600">
                        {m.serviceRecommendation.quoteStatus === "Sent" ? "Quote expired" : `Quote ${m.serviceRecommendation.quoteStatus?.toLowerCase()}`}
                      </div>}
                      {order && (
                        <div className="mt-3 border-t border-gray-100 pt-2">
                          <div className="font-bold">Order {order.orderCode}: {order.status}</div>
                          <div className="mt-1">Paid: ${order.amountPaid || 0} / ${order.amount} {order.currency}</div>
                          {order.status === "In Progress" && (
                            <div className="mt-3">
                              <div className="mb-1 flex justify-between text-[10px] text-gray-600"><span>Estimated timeline</span><span>{getOrderProgress(order)}%</span></div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-[#008060] transition-[width]" style={{ width: `${getOrderProgress(order)}%` }} /></div>
                              <p className="mt-1 text-[10px] text-gray-500">Target completion: {order.deliveryDueAt ? new Date(order.deliveryDueAt).toLocaleDateString() : "Being scheduled"}</p>
                            </div>
                          )}
                          {["unpaid", "partial"].includes(order.paymentStatus) && ["Awaiting Payment", "Ready to Start", "In Progress", "Awaiting Final Payment"].includes(order.status) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input type="number" min="1" max={Math.max(order.amount - (order.amountPaid || 0), 1)} value={reportedPaymentAmount} onChange={(event) => setReportedPaymentAmount(event.target.value)} placeholder={`Amount, up to ${Math.max(order.amount - (order.amountPaid || 0), 0)}`} className="w-36 rounded-md border border-gray-300 px-2 py-1.5" />
                              <button onClick={() => handleReportPayment(order.id, Math.max(order.amount - (order.amountPaid || 0), 0))} className="rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white">I have paid</button>
                            </div>
                          )}
                          {order.paymentStatus === "reported" && <div className="mt-2 text-amber-700">Payment reported. Waiting for your agent to confirm.</div>}
                          {order.status === "Review in Progress" && <div className="mt-3 space-y-2 border-t border-gray-100 pt-2"><div className="font-semibold">Review the completed project</div><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={2} placeholder="Describe any changes you need" className="w-full rounded-md border border-gray-300 px-2 py-1.5"/><div className="flex flex-wrap gap-2"><button onClick={() => handleCustomerReview(order.id, "satisfied")} className="rounded-md bg-emerald-700 px-3 py-1.5 font-semibold text-white">Satisfied</button><button onClick={() => handleCustomerReview(order.id, "request_changes")} className="rounded-md border border-amber-600 px-3 py-1.5 font-semibold text-amber-800">Request changes</button></div></div>}
                          {order.status === "Awaiting Final Payment" && <div className="mt-2 font-semibold text-amber-800">You approved the completed project. Report the remaining payment to finish the order.</div>}
                          {order.status === "Completed" && <div className="mt-2 font-semibold text-emerald-700">Project accepted and order complete.</div>}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 px-1">
                    {isMe && (m.isRead
                      ? <><CheckCheck className="w-3 h-3 text-[#008060]" /><span>Read</span></>
                      : <><Clock className="w-3 h-3" /><span>Sent</span></>)}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="p-3 sm:p-4 border-t border-[#e1e3e5] bg-white">
          {messageError && <p role="alert" className="mb-2 flex items-center gap-1.5 text-xs text-red-700"><AlertCircle className="h-3.5 w-3.5" />{messageError}</p>}
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {selectedConvId && <ChatAttachmentButton conversationId={selectedConvId} onSent={(message) => setMessages((current) => [...current, message])} disabled={sending} />}
            <div className="flex-1 bg-gray-50 border border-[#e1e3e5] rounded-xl focus-within:border-[#008060] focus-within:ring-1 focus-within:ring-[#008060] p-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message to Shopify support... (Press Enter to send)"
                rows={2}
                className="w-full bg-transparent resize-none text-xs text-[#202223] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="bg-[#008060] hover:bg-[#004c3f] disabled:opacity-40 text-white p-3 rounded-xl transition shadow-xs shrink-0 flex items-center justify-center"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-gray-400 mt-2 px-1 flex items-center justify-between">
            <span>Instant delivery to assigned agent • Notification dispatched automatically</span>
            <span className="hidden sm:inline">Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
