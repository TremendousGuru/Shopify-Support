"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  ShieldCheck,
  CheckCircle2,
  Mail,
  User,
  Store,
  Lock,
} from "lucide-react";

export default function CustomerSettingsPage() {
  const [prefs, setPrefs] = useState({
    supportInbox: true,
    emailSupport: true,
    browserPush: true,
    whatsappSupport: false,
    marketingEmails: false,
    promotionalOffers: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/customer/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) {
          setPrefs(data.preferences);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/customer/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#008060]" />
          Communication Preferences & Security
        </h1>
        <p className="text-xs text-[#6d7175] mt-0.5">
          Manage how Shopify Support communicates with you. Support alerts and marketing are strictly separated.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#004c3f] text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#008060]" />
          Preferences updated and saved to database.
        </div>
      )}

      {/* SUPPORT NOTIFICATIONS CATEGORY */}
      <div className="bg-white border border-[#e1e3e5] rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#008060]">
            Support Communications (Operational)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Essential operational updates regarding your support tickets, agent chats, and service requests.
          </p>
        </div>

        <div className="space-y-3 divide-y divide-gray-100">
          <div className="pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#202223]">Support Inbox Badges</div>
              <div className="text-[11px] text-gray-500">Unread indicator badges in the navigation and customer hub</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.supportInbox}
              onChange={() => handleToggle("supportInbox")}
              className="w-4 h-4 text-[#008060] rounded focus:ring-[#008060]"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#202223]">Email Support Updates</div>
              <div className="text-[11px] text-gray-500">
                Receive transactional email notifications when an agent responds or a quote is prepared
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailSupport}
              onChange={() => handleToggle("emailSupport")}
              className="w-4 h-4 text-[#008060] rounded focus:ring-[#008060]"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#202223]">Browser / Device Push Notifications</div>
              <div className="text-[11px] text-gray-500">Required for portal access and support alerts on this device</div>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              aria-label="Device push notifications are required"
              className="w-4 h-4 text-[#008060] rounded focus:ring-[#008060]"
            />
          </div>
        </div>
      </div>

      {/* MARKETING CATEGORY (Strictly separate!) */}
      <div className="bg-white border border-[#e1e3e5] rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Marketing & Commercial Communications (Optional)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Non-essential product announcements and commercial promotions. Support consent does not affect marketing.
          </p>
        </div>

        <div className="space-y-3 divide-y divide-gray-100">
          <div className="pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#202223]">Marketing Emails & Newsletters</div>
              <div className="text-[11px] text-gray-500">Shopify growth tips, case studies, and theme guides</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.marketingEmails}
              onChange={() => handleToggle("marketingEmails")}
              className="w-4 h-4 text-[#008060] rounded focus:ring-[#008060]"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#202223]">Promotional Discounts & Service Offers</div>
              <div className="text-[11px] text-gray-500">Seasonal discount codes for CRO and store audits</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.promotionalOffers}
              onChange={() => handleToggle("promotionalOffers")}
              className="w-4 h-4 text-[#008060] rounded focus:ring-[#008060]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition shadow-xs"
        >
          {saving ? "Saving Preferences..." : "Save Communication Preferences"}
        </button>
      </div>
    </div>
  );
}
