"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

export default function AdminStartPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.portal) {
        router.push(data.portal);
      } else if (["system_admin", "support_supervisor", "data_privacy_admin"].includes(data.user.role)) {
        router.push("/admin");
      } else if (data.user.role === "agent") {
        router.push("/agent");
      } else {
        router.push("/customer");
      }

      router.refresh();
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center shadow-sm overflow-hidden">
              <ShopifyLogoMark size={28} className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">
                Shopify Support
              </span>
              <span className="text-xs text-[#d7e8b6] font-medium">Administrative Control Center</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to portal selection
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#95BF47]/20 text-[#bfe16f] flex items-center justify-center mx-auto mb-3 border border-[#95BF47]/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted access for platform operators, supervisors, and privacy administrators.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="admin@yourdomain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="hidden" aria-hidden="true">
              Internal admin credentials are not displayed in the public UI.
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#95BF47] hover:bg-[#5E8E3E] text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              {loginLoading ? "Verifying..." : "Access Admin Portal"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Access is scoped to admin-only dashboards and audit controls.
          </div>
        </div>
      </main>
    </div>
  );
}
