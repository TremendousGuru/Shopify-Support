"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Sparkles,
  ClipboardList,
  Store,
  FolderOpen,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Search,
} from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

interface CustomerNavProps {
  user: {
    fullName: string;
    email: string;
    customer?: {
      customerCode: string;
      businessName: string;
      websiteUrl?: string | null;
      supportStatus: string;
    } | null;
    unreadNotificationsCount?: number;
  } | null;
  children?: React.ReactNode;
}

export function CustomerNavigation({ user, children }: CustomerNavProps) {
  if (!user) return null;
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navGroups = [
    {
      label: "Home",
      items: [{ label: "Overview", href: "/customer", icon: LayoutDashboard }],
    },
    {
      label: "Support",
      items: [
        { label: "Messages", href: "/customer/messages", icon: MessageSquare },
        { label: "Tickets", href: "/customer/tickets", icon: Ticket },
        { label: "Service requests", href: "/customer/service-requests", icon: ClipboardList },
      ],
    },
    {
      label: "Store",
      items: [
        { label: "Services", href: "/customer/services", icon: Sparkles },
        { label: "My store", href: "/customer/store", icon: Store },
        { label: "Files", href: "/customer/files", icon: FolderOpen },
      ],
    },
    {
      label: "Account",
      items: [
        {
          label: "Notifications",
          href: "/customer/notifications",
          icon: Bell,
          badge: user.unreadNotificationsCount && user.unreadNotificationsCount > 0 ? user.unreadNotificationsCount : undefined,
        },
        { label: "Settings", href: "/customer/settings", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-[#202223]">
      <header className="sticky top-0 z-50 flex h-12 items-center gap-4 bg-[#090909] px-3 text-white sm:px-5">
        <Link href="/customer" className="flex w-[170px] shrink-0 items-center gap-2.5" aria-label="Shopify Support home">
          <ShopifyLogoMark size={25} className="h-6 w-6 object-contain" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold tracking-tight text-white">shopify</span>
            <span className="hidden text-[10px] font-medium tracking-[0.08em] text-white/60 sm:inline">support</span>
          </div>
        </Link>

        <div className="mx-auto hidden w-full max-w-[520px] sm:block">
          <Link
            href="/customer/messages"
            className="flex h-8 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-xs text-white/70 hover:bg-white/15"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search support and store resources</span>
            <span className="ml-auto rounded border border-white/20 px-1 text-[9px]">/</span>
          </Link>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            href="/customer/notifications"
            aria-label="Notifications"
            className="relative rounded-md p-1.5 text-white/80 hover:bg-white/10"
          >
            <Bell className="h-4 w-4" />
            {!!user.unreadNotificationsCount && user.unreadNotificationsCount > 0 && (
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#95BF47]" />
            )}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#d94b83] text-[10px] font-bold text-white">
              {user.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <span className="hidden max-w-32 truncate text-xs font-medium sm:inline">{user.customer?.businessName || user.fullName}</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-48px)]">
        <aside className="hidden w-[196px] shrink-0 flex-col justify-between border-r border-[#e1e3e5] bg-[#ededed] px-2 py-2 md:flex">
        <div>
          <nav className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold text-[#6d7175]">{group.label}</div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex h-8 items-center justify-between rounded-md px-2 text-xs font-medium transition ${
                          isActive
                            ? "bg-white text-[#202223] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                            : "text-[#4a4d52] hover:bg-white/70 hover:text-[#202223]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-[#6d7175]" />
                          {item.label}
                        </span>
                        {item.badge ? <span className="rounded-full bg-[#d82c0d] px-1.5 text-[9px] text-white">{item.badge}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#d8dadd] px-2 pt-2">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#6d7175]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#5E8E3E]" /> Merchant ID
          </div>
          <div className="mt-1 truncate font-mono text-[10px] text-[#202223]">
            {user.customer?.customerCode || "SHOP-CUST-PENDING"}
          </div>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-[#eef6df] text-[#5E8E3E] font-bold text-xs flex items-center justify-center">
                {user.fullName.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-[#202223] truncate">{user.fullName}</div>
                <div className="text-[11px] text-[#6d7175] truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#6d7175] hover:text-[#d82c0d] p-1.5 rounded-md hover:bg-red-50 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="mx-auto min-w-0 w-full max-w-[1440px] flex-1 px-4 pb-24 pt-5 sm:px-6 md:px-8 md:pb-8">
        {children}
      </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e1e3e5] z-40 safe-bottom">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/customer"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname === "/customer" ? "text-[#008060]" : "text-[#6d7175]"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/customer/messages"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium relative ${
              pathname === "/customer/messages" ? "text-[#008060]" : "text-[#6d7175]"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </Link>
          <Link
            href="/customer/service-requests"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname.startsWith("/customer/service-requests") ? "text-[#008060]" : "text-[#6d7175]"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Requests</span>
          </Link>
          <Link
            href="/customer/tickets"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname.startsWith("/customer/tickets") ? "text-[#008060]" : "text-[#6d7175]"
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span>Tickets</span>
          </Link>
          <Link
            href="/customer/settings"
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              pathname === "/customer/settings" ? "text-[#008060]" : "text-[#6d7175]"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
