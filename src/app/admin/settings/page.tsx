"use client";

import { useEffect, useState } from "react";
import { Palette, ShieldCheck, SunMedium, MoonStar } from "lucide-react";

export default function AdminSettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [emailDigest, setEmailDigest] = useState("Daily");
  const [requireAuditNote, setRequireAuditNote] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const savedTheme = localStorage.getItem("shopify-admin-theme");
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    });
  }, []);

  const updateTheme = (nextTheme: "light" | "dark") => {
    setTheme(nextTheme);
    localStorage.setItem("shopify-admin-theme", nextTheme);
    document.documentElement.dataset.adminTheme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border border-[#e5e5e5] bg-white p-5 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="flex items-center gap-2 pb-3 border-b border-[#e5e5e5] mb-4">
          <Palette className="w-5 h-5 text-[#5E8E3E]" />
          <h1 className="text-[18px] font-semibold tracking-[-0.03em] text-[#202223]">Admin settings</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#202223]">
              <SunMedium className="w-4 h-4 text-[#5E8E3E]" /> Appearance
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-white p-3">
                <div>
                  <div className="text-sm font-medium text-[#202223]">Theme</div>
                  <div className="text-[11px] text-[#6b7280]">Choose the portal appearance for this admin account</div>
                </div>

                <div className="inline-flex rounded-lg border border-[#dfe3e8] bg-[#f6f6f7] p-1">
                  <button
                    type="button"
                    onClick={() => updateTheme("light")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium ${
                      theme === "light" ? "bg-white text-[#202223] shadow-sm" : "text-[#6b7280]"
                    }`}
                  >
                    <SunMedium className="w-3.5 h-3.5" /> Light
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTheme("dark")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium ${
                      theme === "dark" ? "bg-[#202223] text-white shadow-sm" : "text-[#6b7280]"
                    }`}
                  >
                    <MoonStar className="w-3.5 h-3.5" /> Dark
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-white p-3">
                <div>
                  <div className="text-sm font-medium text-[#202223]">System alerts</div>
                  <div className="text-[11px] text-[#6b7280]">Display priority merchant and security notifications</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlerts((value) => !value)}
                  className={`relative h-6 w-11 rounded-full transition ${showAlerts ? "bg-[#95BF47]" : "bg-[#dfe3e8]"}`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${showAlerts ? "left-6" : "left-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#202223]">
              <ShieldCheck className="w-4 h-4 text-[#5E8E3E]" /> Governance controls
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-white p-3">
                <div>
                  <div className="text-sm font-medium text-[#202223]">Email digest</div>
                  <div className="text-[11px] text-[#6b7280]">Select the admin summary cadence</div>
                </div>
                <select
                  value={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.value)}
                  className="rounded-lg border border-[#dfe3e8] bg-[#f6f6f7] px-2.5 py-1.5 text-[11px] text-[#202223] focus:outline-none focus:ring-2 focus:ring-[#95BF47]/30"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Off">Off</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-white p-3">
                <div>
                  <div className="text-sm font-medium text-[#202223]">Require audit notes</div>
                  <div className="text-[11px] text-[#6b7280]">Force a reason when viewing sensitive customer information</div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireAuditNote((value) => !value)}
                  className={`relative h-6 w-11 rounded-full transition ${requireAuditNote ? "bg-[#95BF47]" : "bg-[#dfe3e8]"}`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${requireAuditNote ? "left-6" : "left-1"}`}
                  />
                </button>
              </div>

              <div className="rounded-xl border border-[#d7e7b8] bg-[#eef6df] p-3 text-[11px] text-[#375c2f]">
                Administrator controls are restricted to admin roles. Agent accounts do not have access to this section.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
