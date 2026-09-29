"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Headphones,
  User,
  ShieldCheck,
  StickyNote,
  Store,
  RefreshCw,
  CheckCheck,
  AlertCircle,
  Clock,
  Search,
} from "lucide-react";
import { ChatAttachmentButton } from "@/components/shared/ChatAttachmentButton";

export default function AgentConversationsPage() {
  const searchParams = useSearchParams();
  const linkedConversationId = searchParams.get("conversationId");
  const handledLinkId = useRef<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [serviceOptions, setServiceOptions] = useState<any[]>([]);
  const [recommendedServiceId, setRecommendedServiceId] = useState("");
  const [recommendedPrice, setRecommendedPrice] = useState("");
  const [recommendationSending, setRecommendationSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");

  // Internal Note form
  const [internalNoteText, setInternalNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [internalNotesList, setInternalNotesList] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const loadInternalNotes = async (targetId: string) => {
    try {
      const res = await fetch(`/api/internal-notes?targetType=customer&targetId=${targetId}`);
      const data = await res.json();
      if (data.notes) {
        setInternalNotesList(data.notes);
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
    void Promise.resolve().then(() => {
      loadConversations();
      loadOrders();
      return fetch("/api/services").then((response) => response.json()).then((data) => {
        setServiceOptions((data.categories || []).flatMap((category: any) => category.services || []));
      });
    }).catch(console.error);
  }, [loadConversations, loadOrders]);

  useEffect(() => {
    if (!linkedConversationId || linkedConversationId === handledLinkId.current || !conversations.some((conversation) => conversation.id === linkedConversationId)) return;
    handledLinkId.current = linkedConversationId;
    void Promise.resolve().then(() => setSelectedConvId(linkedConversationId));
  }, [linkedConversationId, conversations]);

  useEffect(() => {
    if (selectedConvId) {
      void Promise.resolve().then(() => loadMessages(selectedConvId));
      const timer = setInterval(() => {
        loadMessages(selectedConvId);
        loadOrders();
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [selectedConvId, loadOrders]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);
  const filteredConversations = conversations.filter((conversation) =>
    [conversation.customer?.businessName, conversation.customer?.customerCode, conversation.subject, conversation.lastMessage?.content]
      .some((value) => String(value || "").toLowerCase().includes(conversationSearch.toLowerCase()))
  );

  useEffect(() => {
    if (activeConv?.customerId) {
      void Promise.resolve().then(() => loadInternalNotes(activeConv.customerId));
    }
  }, [activeConv?.customerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim() || !activeConv?.customerId || noteSaving) return;

    setNoteSaving(true);
    try {
      const res = await fetch("/api/internal-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "customer",
          targetId: activeConv.customerId,
          content: internalNoteText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInternalNoteText("");
        loadInternalNotes(activeConv.customerId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleRecommendService = async () => {
    if (!selectedConvId || !recommendedServiceId || recommendationSending) return;
    setRecommendationSending(true);
    try {
      const response = await fetch("/api/service-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, serviceId: recommendedServiceId, quotePrice: recommendedPrice || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send service recommendation");
      setRecommendedServiceId("");
      setRecommendedPrice("");
      await loadMessages(selectedConvId);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Could not send service recommendation");
    } finally {
      setRecommendationSending(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: string, status?: string) => {
    const response = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action, status }),
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error || "Could not update order");
      return;
    }
    await loadOrders();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[550px]">
      {/* 1. Conversations Queue (Left) */}
      <div className="w-full lg:w-72 border-r border-slate-800 flex flex-col bg-slate-950/60">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Inbox ({conversations.length})
            </span>
          </div>
          <button
            onClick={() => loadConversations()}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <label className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 text-slate-500">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input aria-label="Search conversations" value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search inbox" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500" />
        </label>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {filteredConversations.map((c) => {
            const isSelected = c.id === selectedConvId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className={`w-full text-left p-3 transition flex flex-col gap-1 ${
                  isSelected ? "bg-slate-800 border-l-4 border-blue-500" : "hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {c.customer?.businessName || c.subject}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {c.lastMessage?.content || "No messages yet"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                    {c.customer?.customerCode || "CUSTOMER"}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-blue-400">
                    {c.type}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Chat Conversation (Center) */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {/* Chat Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{activeConv?.customer?.businessName || "Merchant Support Thread"}</span>
                <span className="font-mono text-[10px] text-blue-400">
                  {activeConv?.customer?.customerCode}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {activeConv?.subject}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-950/40">
          {messages.map((m) => {
            const isAgent = m.senderRole === "agent" || m.senderRole === "system_admin";
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
                className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-300">{m.senderName}</span>
                  <span>•</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isAgent
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-xs"
                  }`}
                >
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                  {attachments.map((attachment) => (
                    <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="mt-2 block underline underline-offset-2">
                      {attachment.fileType?.startsWith("image/") ? <Image src={attachment.fileUrl} alt={attachment.fileName} width={640} height={480} unoptimized className="max-h-48 max-w-full rounded-md object-contain" /> : attachment.fileName}
                    </a>
                  ))}
                </div>
                {isAgent && <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400">
                  {m.isRead ? <><CheckCheck className="h-3 w-3 text-emerald-400" /><span>Read</span></> : <><Clock className="h-3 w-3" /><span>Sent</span></>}
                </div>}
                {m.serviceRecommendation && (
                  <div className="mt-2 w-full max-w-lg rounded-lg border border-blue-500/30 bg-slate-900 p-3 text-xs text-slate-100">
                    <div className="font-bold">Service quote: {m.serviceRecommendation.serviceName}</div>
                    <div className="mt-1">${m.serviceRecommendation.quotePrice} USD · {m.serviceRecommendation.quoteTimeline}</div>
                    {m.serviceRecommendation.quoteTerms && <p className="mt-1 text-slate-300">{m.serviceRecommendation.quoteTerms}</p>}
                    <div className="mt-2 text-blue-300">Quote {m.serviceRecommendation.quoteStatus?.toLowerCase()}</div>
                    {order && (
                      <div className="mt-2 border-t border-slate-700 pt-2">
                        <div className="font-semibold">Order {order.orderCode}: {order.status}</div>
                        <div className="mt-1">Payment: {order.paymentStatus}</div>
                        {order.paymentStatus === "reported" && <button onClick={() => handleOrderAction(order.id, "confirm_payment")} className="mt-2 rounded-md bg-emerald-600 px-3 py-1.5 font-semibold text-white">Confirm payment</button>}
                        {order.paymentStatus === "confirmed" && (
                          <select value={order.status} onChange={(event) => handleOrderAction(order.id, "update_status", event.target.value)} className="mt-2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5">
                            {[order.status, ...(order.status === "Ready to Start" ? ["In Progress"] : order.status === "In Progress" ? ["Quality Review", "Completed"] : order.status === "Quality Review" ? ["In Progress", "Completed"] : order.status === "Completed" ? ["Closed"] : [])].map((nextStatus) => <option key={nextStatus} value={nextStatus}>{nextStatus}</option>)}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <select
              value={recommendedServiceId}
              onChange={(event) => setRecommendedServiceId(event.target.value)}
              className="min-w-48 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="">Recommend a catalog service...</option>
              {serviceOptions.map((service) => <option key={service.id} value={service.id}>{service.name} · ${service.startingPrice || 0}</option>)}
            </select>
            <input
              type="number"
              min="1"
              aria-label="Quote price in USD"
              value={recommendedPrice}
              onChange={(event) => setRecommendedPrice(event.target.value)}
              placeholder="Quote USD"
              className="w-28 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-white"
            />
            <button type="button" disabled={!recommendedServiceId || recommendationSending} onClick={handleRecommendService} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
              {recommendationSending ? "Sending..." : "Send quote"}
            </button>
          </div>
          {messageError && <p role="alert" className="mb-2 flex items-center gap-1.5 text-xs text-red-300"><AlertCircle className="h-3.5 w-3.5" />{messageError}</p>}
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {selectedConvId && <ChatAttachmentButton conversationId={selectedConvId} customerId={activeConv?.customerId} agentMode disabled={sending} onSent={(message) => setMessages((current) => [...current, message])} />}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Reply to merchant as Shopify Support... (Enter to send)"
              rows={2}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-3 rounded-xl transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Context & Internal Notes Panel (Right Column) */}
      <div className="hidden xl:flex flex-col w-80 border-l border-slate-800 bg-slate-950/70 p-4 space-y-4 overflow-y-auto">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Merchant Context
          </h3>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="text-white font-bold">{activeConv?.customer?.businessName}</div>
            <div className="font-mono text-blue-400 text-[11px]">{activeConv?.customer?.customerCode}</div>
          </div>
        </div>

        {/* Internal Notes Section (CRITICAL REQUIREMENT: Never shown to customer!) */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
            <StickyNote className="w-4 h-4" />
            <span>Private Internal Notes</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3 leading-tight">
            Notes written here are restricted to agents and supervisors. Never visible to customer.
          </p>

          <form onSubmit={handleAddInternalNote} className="space-y-2 mb-3">
            <textarea
              rows={2}
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="Add private note (e.g. Needs Liquid patch on staging first)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
            />
            <button
              type="submit"
              disabled={noteSaving || !internalNoteText.trim()}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] font-bold py-1.5 rounded-lg transition"
            >
              {noteSaving ? "Saving Note..." : "Save Internal Note"}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2">
            {internalNotesList.map((n) => (
              <div key={n.id} className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between text-[10px] text-amber-400/80 mb-1">
                  <span>{n.authorName}</span>
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-amber-100 text-[11px] leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
