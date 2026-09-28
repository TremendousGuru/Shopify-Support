"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Sparkles,
  Search,
  Settings,
  Store,
  Users,
  BriefcaseBusiness,
} from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

interface AdminNavProps {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  children?: React.ReactNode;
}

export function AdminNavigation({ user, children }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const theme = localStorage.getItem("shopify-admin-theme") === "dark" ? "dark" : "light";
    document.documentElement.dataset.adminTheme = theme;
    document.documentElement.style.colorScheme = theme;
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Merchants", href: "/admin/customers", icon: Store },
    { label: "Agents", href: "/admin/agents", icon: Users },
    { label: "Services", href: "/admin/services", icon: Sparkles },
    { label: "Tickets", href: "/admin/tickets", icon: MessageSquareText },
    { label: "Requests", href: "/admin/service-requests", icon: BriefcaseBusiness },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="admin-portal min-h-screen bg-[#f5f5f5] text-[#202223]">
      <header className="h-[72px] bg-white border-b border-[#e5e5e5] sticky top-0 z-30">
        <div className="h-full flex items-center">
          <div className="w-[220px] pl-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-md bg-transparent flex items-center justify-center overflow-hidden">
              <ShopifyLogoMark size={22} className="w-6 h-6 object-contain" />
            </div>
            <div className="leading-none">
              <div className="text-[17px] font-semibold tracking-[-0.03em] text-[#202223]">
                shopify <span className="font-normal">partners</span>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4">
            <div className="max-w-[680px] relative">
              <Search className="w-4 h-4 text-[#6b7280] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                className="w-full h-11 rounded-xl border border-[#dfe3e8] bg-[#f6f6f7] pl-11 pr-4 text-sm text-[#202223] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#95BF47]/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pr-5 shrink-0">
            <button className="w-10 h-10 rounded-full hover:bg-[#f6f6f7] flex items-center justify-center text-[#202223] transition">
              <Bell className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-2 py-1.5 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-[#dfe7d1] text-[#5E8E3E] text-[10px] font-bold flex items-center justify-center">
                {user.fullName.slice(0, 2).toUpperCase() || "TR"}
              </div>
              <span className="text-sm font-medium text-[#202223]">{user.fullName.split(" ")[0] || "David"}</span>
              <ChevronDown className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="w-[220px] border-r border-[#e5e5e5] bg-[#f5f5f5] py-4 px-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition ${
                    isActive
                      ? "bg-[#eaf5dd] text-[#1d4d2c]"
                      : "text-[#3b3f45] hover:bg-white hover:text-[#202223]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#5E8E3E]" : "text-[#5b5f66]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 px-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium text-[#202223] hover:bg-white transition"
            >
              <LogOut className="w-4 h-4 text-[#5b5f66]" />
              Log out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
