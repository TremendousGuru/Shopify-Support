import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { customers, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Store, ShieldCheck, CheckCircle2, ExternalLink, Globe, Layers, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerStorePage() {
  const user = await getCurrentUser();
  if (!user || !user.customer) return null;

  const storeList = await db
    .select()
    .from(stores)
    .where(eq(stores.customerId, user.customer.id));

  const primaryStore = storeList[0] || null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2">
          <Store className="w-5 h-5 text-[#008060]" />
          My Shopify Store
        </h1>
        <p className="text-xs text-[#6d7175] mt-0.5">
          Store context and connected ecommerce architecture for customer support and service delivery.
        </p>
      </div>

      {/* Main Store Card */}
      <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#008060] flex items-center justify-center font-bold">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#202223]">
                {primaryStore?.storeName || user.customer.businessName}
              </h2>
              <a
                href={primaryStore?.storeUrl || user.customer.websiteUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#008060] hover:underline flex items-center gap-1 font-mono"
              >
                {primaryStore?.storeUrl || user.customer.websiteUrl || "https://nordicglow.myshopify.com"}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-[#008060] border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected Primary Store
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-gray-50 p-4 rounded-xl">
            <span className="text-gray-400 block mb-1">Ecommerce Platform</span>
            <span className="font-bold text-[#202223] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Shopify Online Store 2.0
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <span className="text-gray-400 block mb-1">Niche / Category</span>
            <span className="font-bold text-[#202223]">
              {primaryStore?.niche || user.customer.storeCategory || "Beauty & Wellness"}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <span className="text-gray-400 block mb-1">Customer Identifier</span>
            <span className="font-mono font-bold text-[#008060]">
              {user.customer.customerCode}
            </span>
          </div>
        </div>

        {/* Security and Credentials Policy Note */}
        <div className="bg-[#f0f7f5] border border-[#bbf0dc] rounded-xl p-4 text-xs text-[#004c3f] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#008060]" />
            Shopify Password Security Policy
          </div>
          <p className="leading-relaxed">
            Shopify Support strictly abides by Shopify Partner security policies. We never ask for your Shopify account password, credit card details, or sensitive owner credentials. All technical collaboration is managed via official preview themes and collaborator permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
