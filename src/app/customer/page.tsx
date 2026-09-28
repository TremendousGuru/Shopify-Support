import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { customers, tickets, serviceRequests, services, conversations, agents, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  Store,
  ShieldCheck,
  MessageSquare,
  Ticket,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch customer record
  let customer = user.customer;
  if (!customer) {
    const [found] = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);
    customer = found || null;
  }

  // Fetch customer's tickets
  const customerTickets = customer
    ? await db
        .select()
        .from(tickets)
        .where(eq(tickets.customerId, customer.id))
        .orderBy(desc(tickets.createdAt))
        .limit(5)
    : [];

  // Fetch customer's service requests
  const customerRequests = customer
    ? await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.customerId, customer.id))
        .orderBy(desc(serviceRequests.createdAt))
        .limit(5)
    : [];

  // Fetch assigned agent info
  let assignedAgentUser = null;
  if (customer?.assignedAgentId) {
    const [agentRec] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, customer.assignedAgentId))
      .limit(1);

    if (agentRec) {
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.id, agentRec.userId))
        .limit(1);

      assignedAgentUser = {
        agentCode: agentRec.agentCode,
        department: agentRec.department,
        status: agentRec.status,
        fullName: u?.fullName || "Support Specialist",
        avatarUrl: u?.avatarUrl,
      };
    }
  }

  const openTicketsCount = customerTickets.filter(
    (t) => t.status !== "Closed" && t.status !== "Resolved"
  ).length;

  const activeRequestsCount = customerRequests.filter(
    (r) => r.status !== "Completed" && r.status !== "Closed" && r.status !== "Cancelled"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#004c3f] to-[#008060] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-xs text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              Official Shopify Support
            </span>
            <span className="bg-emerald-400/20 text-emerald-200 text-xs px-2 py-0.5 rounded-full font-mono">
              {customer?.customerCode || "SHOP-CUST-100001"}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.fullName}!
          </h1>
          <p className="text-sm text-emerald-100 mt-1 max-w-xl">
            {customer?.businessName ? (
              <span>Managing <strong>{customer.businessName}</strong>. </span>
            ) : null}
            Your dedicated Shopify engineering and conversion support team is ready to assist.
          </p>
        </div>

        {/* Assigned Agent quick card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 min-w-[240px] shrink-0">
          <div className="text-[11px] text-emerald-200 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Assigned Architect</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Available
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-2">
            <div className="w-9 h-9 rounded-full bg-white text-[#008060] font-bold text-xs flex items-center justify-center shadow-xs">
              {assignedAgentUser?.fullName ? assignedAgentUser.fullName.charAt(0) : "S"}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {assignedAgentUser?.fullName || "Sarah Jenkins"}
              </div>
              <div className="text-[11px] text-emerald-100">
                {assignedAgentUser?.agentCode || "SHOP-AGENT-001"}
              </div>
            </div>
          </div>

          <Link
            href="/customer/messages"
            className="mt-3 block text-center bg-white text-[#004c3f] hover:bg-emerald-50 text-xs font-bold py-1.5 rounded-lg transition"
          >
            Open Live Support Chat
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e1e3e5] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-[#6d7175]">Customer Identifier</div>
          <div className="text-base font-bold text-[#008060] font-mono mt-1">
            {customer?.customerCode || "SHOP-CUST-100001"}
          </div>
          <div className="text-[11px] text-[#6d7175] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#008060]" />
            Status: {customer?.supportStatus || "Activated"}
          </div>
        </div>

        <div className="bg-white border border-[#e1e3e5] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-[#6d7175]">Open Support Tickets</div>
          <div className="text-2xl font-bold text-[#202223] mt-1">{openTicketsCount}</div>
          <Link
            href="/customer/tickets"
            className="text-[11px] text-[#008060] font-medium hover:underline mt-1 inline-flex items-center gap-0.5"
          >
            View tickets <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-[#e1e3e5] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-[#6d7175]">Active Service Requests</div>
          <div className="text-2xl font-bold text-[#202223] mt-1">{activeRequestsCount}</div>
          <Link
            href="/customer/service-requests"
            className="text-[11px] text-[#008060] font-medium hover:underline mt-1 inline-flex items-center gap-0.5"
          >
            Track timeline <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-[#e1e3e5] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-[#6d7175]">Connected Store</div>
          <div className="text-sm font-bold text-[#202223] truncate mt-1">
            {customer?.businessName || "Nordic Glow Skincare"}
          </div>
          <div className="text-[11px] text-emerald-700 truncate mt-1 flex items-center gap-1 font-mono">
            <Store className="w-3 h-3" />
            Shopify Storefront
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white border border-[#e1e3e5] rounded-xl p-4 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6d7175] mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/customer/messages"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#008060] hover:bg-emerald-50/50 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#008060] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#202223] group-hover:text-[#008060]">
                Live Support Chat
              </div>
              <div className="text-[11px] text-[#6d7175]">Talk with Sarah</div>
            </div>
          </Link>

          <Link
            href="/customer/tickets"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#008060] hover:bg-emerald-50/50 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#202223] group-hover:text-blue-600">
                New Support Ticket
              </div>
              <div className="text-[11px] text-[#6d7175]">Report store glitch</div>
            </div>
          </Link>

          <Link
            href="/customer/services"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#008060] hover:bg-emerald-50/50 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#202223] group-hover:text-purple-600">
                Request Service
              </div>
              <div className="text-[11px] text-[#6d7175]">Redesign & CRO</div>
            </div>
          </Link>

          <Link
            href="/customer/files"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#008060] hover:bg-emerald-50/50 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#202223] group-hover:text-amber-700">
                Upload Assets
              </div>
              <div className="text-[11px] text-[#6d7175]">Screenshots & docs</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Service Requests & Tickets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Service Requests */}
          <div className="bg-white border border-[#e1e3e5] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#008060]" />
                <h2 className="text-sm font-bold text-[#202223]">Ecommerce Service Requests</h2>
              </div>
              <Link
                href="/customer/service-requests"
                className="text-xs text-[#008060] font-semibold hover:underline flex items-center gap-1"
              >
                All Requests <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {customerRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6d7175]">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No service requests submitted yet.</p>
                <Link
                  href="/customer/services"
                  className="mt-2 inline-block font-bold text-[#008060] hover:underline"
                >
                  Explore Shopify Service Catalog
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {customerRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border border-[#e1e3e5] rounded-xl p-4 hover:border-gray-300 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {req.requestCode}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            req.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : req.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6d7175]">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#202223] font-medium line-clamp-2 mb-3">
                      {req.description}
                    </p>

                    {/* Visual Progress Steps Preview */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold">
                      <div className="bg-emerald-100 text-emerald-800 py-1 rounded">Submitted ✓</div>
                      <div className="bg-emerald-100 text-emerald-800 py-1 rounded">Under Review ✓</div>
                      <div className="bg-emerald-100 text-emerald-800 py-1 rounded">Approved ✓</div>
                      <div className="bg-blue-100 text-blue-800 py-1 rounded animate-pulse">In Progress</div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      {req.quotePrice ? (
                        <span className="text-[#008060] font-bold">
                          Quote: ${req.quotePrice} USD ({req.quoteTimeline})
                        </span>
                      ) : (
                        <span className="text-gray-500">Under engineering review</span>
                      )}
                      <Link
                        href={`/customer/service-requests`}
                        className="text-[#008060] hover:underline font-semibold"
                      >
                        View Full Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support Tickets */}
          <div className="bg-white border border-[#e1e3e5] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-[#202223]">Recent Support Tickets</h2>
              </div>
              <Link
                href="/customer/tickets"
                className="text-xs text-[#008060] font-semibold hover:underline flex items-center gap-1"
              >
                All Tickets <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {customerTickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6d7175]">
                No support tickets found. Everything running smoothly!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {customerTickets.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {t.ticketCode}
                        </span>
                        <span className="text-xs font-semibold text-[#202223] truncate">
                          {t.subject}
                        </span>
                      </div>
                      <p className="text-xs text-[#6d7175] truncate">{t.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.status === "In Progress"
                            ? "bg-blue-50 text-blue-700"
                            : t.status === "Open"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Store Details & Support Team Info */}
        <div className="space-y-6">
          {/* Store Info Card */}
          <div className="bg-white border border-[#e1e3e5] rounded-xl p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6d7175] mb-3">
              Store Information
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-gray-500 block">Store Name</span>
                <span className="font-bold text-[#202223]">{customer?.businessName || "Nordic Glow Skincare"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Store URL</span>
                <a
                  href={customer?.websiteUrl || "https://nordicglow.myshopify.com"}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[#008060] font-medium hover:underline flex items-center gap-1"
                >
                  {customer?.websiteUrl || "nordicglow.myshopify.com"}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <span className="text-gray-500 block">Niche / Category</span>
                <span className="font-medium text-[#202223]">{customer?.storeCategory || "Beauty & Skincare"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Ecommerce Platform</span>
                <span className="inline-block bg-emerald-50 text-[#008060] px-2 py-0.5 rounded font-semibold text-[11px]">
                  Shopify Online Store 2.0
                </span>
              </div>
            </div>
          </div>

          {/* Support Guarantee & Security */}
          <div className="bg-[#f0f7f5] border border-[#bbf0dc] rounded-xl p-5">
            <div className="flex items-center gap-2 text-[#004c3f] font-bold text-xs mb-2">
              <ShieldCheck className="w-4 h-4 text-[#008060]" />
              Merchant Trust & Privacy
            </div>
            <p className="text-xs text-[#004c3f] leading-relaxed">
              Shopify Support enforces strict end-to-end access boundaries. Your conversations, theme codes, and store diagnostics are audited and only visible to assigned specialists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
