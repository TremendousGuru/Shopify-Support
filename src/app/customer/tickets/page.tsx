"use client";

import { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Search,
} from "lucide-react";
import Link from "next/link";

export default function CustomerTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New ticket state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Shopify Theme & Liquid Issue");
  const [priority, setPriority] = useState("Normal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          category,
          priority,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      setShowCreateModal(false);
      setSubject("");
      setDescription("");
      fetchTickets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === "all" || t.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#008060]" />
            Support Tickets
          </h1>
          <p className="text-xs text-[#6d7175] mt-0.5">
            Submit issues, track technical fixes, and receive updates directly from certified Shopify specialists.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Support Ticket
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#e1e3e5] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by code or title..."
            className="w-full text-xs text-[#202223] bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#6d7175]">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none font-medium text-[#202223]"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="waiting for customer">Waiting for Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-[#e1e3e5] rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading support tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">No support tickets found.</p>
            <p className="text-gray-400 mt-1">Need help with your Shopify store? Create a ticket to get assisted.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e1e3e5]">
            {filteredTickets.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                      {t.ticketCode}
                    </span>
                    <span className="text-xs font-bold text-[#202223] truncate">
                      {t.subject}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.2 rounded font-semibold ${
                        t.priority === "Urgent"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : t.priority === "High"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <p className="text-xs text-[#6d7175] line-clamp-2">{t.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6d7175] pt-1">
                    <span>Category: <strong>{t.category}</strong></span>
                    <span>•</span>
                    <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                    {t.assignedAgent && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          Assigned: {t.assignedAgent.fullName} ({t.assignedAgent.agentCode})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      t.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : t.status === "Open"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {t.status}
                  </span>

                  <Link
                    href="/customer/messages"
                    className="p-2 text-gray-400 hover:text-[#008060] rounded-lg hover:bg-emerald-50 transition"
                    title="Open ticket discussion"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e1e3e5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e5]">
              <h2 className="text-base font-bold text-[#202223] flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#008060]" />
                Create Support Ticket
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">Subject / Issue Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Checkout currency switcher glitch on iOS"
                  className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg bg-white focus:ring-2 focus:ring-[#008060]"
                  >
                    <option>Shopify Theme & Liquid Issue</option>
                    <option>Checkout & Cart Drop-off</option>
                    <option>App Conflict & Integration</option>
                    <option>Mobile Layout Glitch</option>
                    <option>Speed & Core Web Vitals</option>
                    <option>General Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg bg-white focus:ring-2 focus:ring-[#008060]"
                  >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, steps to reproduce, or specific URLs/products affected..."
                  className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="pt-3 border-t border-[#e1e3e5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
