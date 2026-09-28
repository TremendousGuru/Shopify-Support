"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Ticket,
  ClipboardList,
  Check,
} from "lucide-react";

export default function CustomerNotificationsPage() {
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

  const markAllAsRead = async () => {
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
          <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#008060]" />
            Notifications Center
          </h1>
          <p className="text-xs text-[#6d7175] mt-0.5">
            Operational alerts for ticket replies, agent messages, and service milestones.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold text-[#008060] hover:underline flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">No notifications</p>
            <p className="text-gray-400 mt-0.5">You are all caught up on all store updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 transition ${
                  !n.isRead ? "bg-emerald-50/40" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      !n.isRead ? "bg-[#008060] text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {n.type === "NEW_MESSAGE" ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : n.type.includes("TICKET") ? (
                      <Ticket className="w-4 h-4" />
                    ) : (
                      <ClipboardList className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#202223]">{n.title}</div>
                    <p className="text-xs text-gray-600 mt-0.5">{n.body}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {n.link && (
                  <Link
                    href={n.link}
                    className="text-xs font-semibold text-[#008060] hover:underline shrink-0 flex items-center gap-0.5"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
