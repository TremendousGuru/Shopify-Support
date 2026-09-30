"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Ticket,
  ClipboardList,
  StickyNote,
  FolderOpen,
  Bell,
  LogOut,
  Headphones,
  CheckCircle,
  UserRound,
} from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

interface AgentNavProps {
  user: {
    fullName: string;
    email: string;
    agent?: {
      agentCode: string;
      department: string;
      status: string;
    } | null;
    unreadNotificationsCount?: number;
  };
}

export function AgentNavigation({ user }: AgentNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { label: "Agent Dashboard", href: "/agent", icon: LayoutDashboard },
    { label: "My Customers", href: "/agent/customers", icon: Users },
    { label: "Conversations", href: "/agent/conversations", icon: MessageSquare },
    { label: "Tickets Queue", href: "/agent/tickets", icon: Ticket },
    { label: "Service Requests", href: "/agent/service-requests", icon: ClipboardList },
    { label: "Internal Notes", href: "/agent/notes", icon: StickyNote },
    { label: "Customer Files", href: "/agent/files", icon: FolderOpen },
    { label: "Profile & Display Name", href: "/agent/profile", icon: UserRound },
    {
      label: "Notifications",
      href: "/agent/notifications",
      icon: Bell,
      badge: user.unreadNotificationsCount && user.unreadNotificationsCount > 0 ? user.unreadNotificationsCount : undefined,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 min-h-[calc(100vh-41px)] sticky top-[41px] justify-between p-4 z-20">
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800 mb-4">
            <ShopifyLogoMark size={32} className="h-8 w-8 shrink-0 object-contain" />
            <div>
              <div className="font-bold text-sm text-white tracking-tight">Shopify Support</div>
              <span className="text-[11px] text-[#d7e8b6] font-medium bg-[#5E8E3E] px-1.5 py-0.5 rounded border border-[#95BF47]">
                Agent Workspace
              </span>
            </div>
          </div>

          {/* Agent Code Card */}
          <div className="bg-slate-800/80 border border-[#95BF47]/40 rounded-lg p-3 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              <span>Agent ID</span>
              <span className="flex items-center gap-1 text-[#bfe16f] text-[10px]">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            </div>
            <div className="text-sm font-bold text-[#bfe16f] font-mono mt-0.5">
              {user.agent?.agentCode || "SHOP-AGENT-001"}
            </div>
            <div className="text-xs text-slate-200 font-medium mt-1 truncate">{user.fullName}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {user.agent?.department || "Merchant Support"}
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-[#95BF47] text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="border-t border-slate-800 pt-3 mt-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-[#95BF47]/20 text-[#bfe16f] font-bold text-xs flex items-center justify-center border border-[#95BF47]/40">
                {user.fullName.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{user.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation for Agents */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 safe-bottom text-slate-300">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/agent"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname === "/agent" ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/agent/customers"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname.startsWith("/agent/customers") ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Merchants</span>
          </Link>
          <Link
            href="/agent/conversations"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname.startsWith("/agent/conversations") ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </Link>
          <Link
            href="/agent/tickets"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname.startsWith("/agent/tickets") ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span>Tickets</span>
          </Link>
          <Link
            href="/agent/service-requests"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname.startsWith("/agent/service-requests") ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Services</span>
          </Link>
          <Link
            href="/agent/profile"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname.startsWith("/agent/profile") ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <UserRound className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
