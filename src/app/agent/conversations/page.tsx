"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

export default function AgentConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Internal Note form
  const [internalNoteText, setInternalNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [internalNotesList, setInternalNotesList] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (!selectedConvId && data.conversations.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
      const timer = setInterval(() => {
        loadMessages(selectedConvId);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);

  useEffect(() => {
    if (activeConv?.customerId) {
      loadInternalNotes(activeConv.customerId);
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
    setContent("");

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
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (e) {
      console.error(e);
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

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {conversations.map((c) => {
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
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
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
