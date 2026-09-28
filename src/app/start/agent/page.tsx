"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

function AgentStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [activeTab, setActiveTab] = useState<"invitation" | "login">(token ? "invitation" : "login");
  const [tokenInput, setTokenInput] = useState(token || "");

  // Verification state
  const [verifying, setVerifying] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteDepartment, setInviteDepartment] = useState<string>("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Agent form
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [specialties, setSpecialties] = useState("Shopify Themes, Liquid 2.0, CRO, SEO");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Agent login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Verify token on mount or input
  useEffect(() => {
    if (token) {
      verifyInvitationToken(token);
    }
  }, [token]);

  const verifyInvitationToken = async (tok: string) => {
    if (!tok.trim()) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/auth/agent-onboard?token=${encodeURIComponent(tok.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setTokenValid(false);
        setVerifyError(data.error || "Invalid or expired invitation token.");
      } else {
        setTokenValid(true);
        setInviteEmail(data.email);
        setInviteDepartment(data.department);
      }
    } catch (e: any) {
      setTokenValid(false);
      setVerifyError("Failed to verify invitation token.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCompleteAgentOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/auth/agent-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim(),
          fullName,
          password,
          phone,
          specialties,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard agent");
      }

      // Success -> Redirect to agent portal
      router.push("/agent");
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgentLogin = async (e: React.FormEvent) => {
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
      } else if (data.user.role === "agent") {
        router.push("/agent");
      } else if (["system_admin", "support_supervisor"].includes(data.user.role)) {
        router.push("/admin");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center shadow-xs overflow-hidden">
              <ShopifyLogoMark size={28} className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">
                Shopify Support
              </span>
              <span className="text-xs text-[#bfe16f] font-medium">Agent Workspace & Onboarding</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab("login")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === "login"
                  ? "bg-[#95BF47] text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Agent Login
            </button>
            <button
              onClick={() => setActiveTab("invitation")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === "invitation"
                  ? "bg-[#95BF47] text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Verify Invitation
            </button>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "login" ? (
          /* Agent Login Card */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#95BF47]/20 text-[#bfe16f] flex items-center justify-center mx-auto mb-3 border border-[#95BF47]/40">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white">Support Agent Sign In</h1>
              <p className="text-xs text-slate-400 mt-1">
                Authorized Shopify Support personnel only. All access is monitored.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-lg">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAgentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Agent Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="name@company.com"
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
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                {loginLoading ? "Verifying..." : "Access Agent Portal"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Agent Invitation Verification & Onboarding Card */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white">Agent Invitation Gate</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Open registration is disabled. You must hold an active invitation token issued by a System Administrator.
              </p>
            </div>

            {/* Token entry if not validated */}
            {!tokenValid ? (
              <div className="space-y-4">
                {verifyError && (
                  <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{verifyError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Invitation Token
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter 64-character invitation token"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={verifying || !tokenInput.trim()}
                  onClick={() => verifyInvitationToken(tokenInput)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                >
                  {verifying ? "Checking Token with Database..." : "Verify Invitation"}
                </button>

                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-400">
                  <div className="font-semibold text-slate-300 mb-1">Want to test creating an invitation?</div>
                  <p>
                    Log in as System Admin (<code className="text-purple-300">/admin</code>), visit{" "}
                    <strong>Agents & Invitations</strong>, click <strong>"Invite New Agent"</strong>, and copy the generated link.
                  </p>
                </div>
              </div>
            ) : (
              /* Valid Token -> Show Onboarding Activation Form */
              <form onSubmit={handleCompleteAgentOnboard} className="space-y-4">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Invitation Verified for: <strong>{inviteEmail}</strong></span>
                  </div>
                  <span className="font-mono text-[11px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                    {inviteDepartment}
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-lg">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Liam Bergqvist"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Create Agent Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specialties & Skills</label>
                  <input
                    type="text"
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="e.g. Liquid 2.0, Theme Customization, SEO"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3 bg-blue-950/40 border border-blue-800 rounded-lg text-xs text-blue-300">
                  <div className="font-semibold mb-0.5">Agent Identifier Issuance</div>
                  <p className="text-[11px] text-blue-400">
                    Upon activation, the system will assign your official sequential Agent Code:{" "}
                    <code className="font-bold text-white">SHOP-AGENT-XXX</code>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  {submitting ? "Activating Agent Account..." : "Activate Account & Enter Agent Portal"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AgentStartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Agent Portal...</div>}>
      <AgentStartContent />
    </Suspense>
  );
}
