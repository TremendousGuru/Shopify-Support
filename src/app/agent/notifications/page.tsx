"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  MessageSquare,
  Ticket,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

export default function AgentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Agent Notifications Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational alerts for merchant messages, new ticket assignments, and service requests.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl divide-y divide-slate-800">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No notifications.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition ${
                !n.isRead ? "bg-blue-950/20" : "hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  {n.type === "NEW_MESSAGE" ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : n.type.includes("TICKET") ? (
                    <Ticket className="w-4 h-4" />
                  ) : (
                    <ClipboardList className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-white">{n.title}</div>
                  <p className="text-xs text-slate-300 mt-0.5">{n.body}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {n.link && (
                <Link
                  href={n.link}
                  className="text-xs font-semibold text-blue-400 hover:underline shrink-0 flex items-center gap-0.5"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
