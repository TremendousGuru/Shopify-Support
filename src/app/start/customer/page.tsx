"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bell,
  Headphones,
  Mail,
  Lock,
  Building,
  Globe,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

export default function CustomerStartPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"onboarding" | "login">("onboarding");

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingTicket, setHasExistingTicket] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    businessName: "",
    phone: "",
    websiteUrl: "",
    storeName: "",
    storeUrl: "",
    storeCategory: "Fashion & Apparel",
    businessStage: "Growing ($10k-$50k/mo)",
    primaryGoals: "Improve store conversion rate and mobile user experience",
    termsAccepted: false,
    privacyPolicyAccepted: false,
    supportPolicyAccepted: false,
    marketingConsent: false,
    notificationPrefs: {
      supportInbox: true,
      emailSupport: true,
      browserPush: true,
    },
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Notification Permission Request
  const requestBrowserNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setFormData((prev) => ({
            ...prev,
            notificationPrefs: { ...prev.notificationPrefs, browserPush: true },
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            notificationPrefs: { ...prev.notificationPrefs, browserPush: false },
          }));
        }
      } catch (e) {
        console.warn("Notification permission request error:", e);
      }
    }
  };

  const handleNextStep = () => {
    setError(null);
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid business email address.");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Please choose a password with at least 8 characters.");
      return;
    }
    setStep(2);
  };

  const handleCompleteOnboarding = async () => {
    setError(null);
    if (!formData.fullName.trim() || !formData.businessName.trim() || !formData.storeUrl.trim()) {
      setError("Add your name, business name, and Shopify store URL to continue.");
      return;
    }
    if (hasExistingTicket && !ticketNumber.trim()) {
      setError("Enter your existing ticket number or choose that you do not have one.");
      return;
    }
    if (!formData.termsAccepted || !formData.privacyPolicyAccepted || !formData.supportPolicyAccepted) {
      setError("Accept the Terms, Privacy Notice, and support communications policy to continue.");
      return;
    }

    setLoading(true);

    try {
      const agentToken = new URLSearchParams(window.location.search).get("agentToken");
      const res = await fetch("/api/auth/customer-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          storeName: formData.storeName || formData.businessName,
          websiteUrl: formData.websiteUrl || formData.storeUrl,
          existingTicketNumber: hasExistingTicket ? ticketNumber : "",
          agentToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      router.push(`/customer/messages?conversationId=${encodeURIComponent(data.conversationId)}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
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
          portal: "/customer",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.portal) {
        router.push(data.portal);
      } else if (data.user.role === "customer") {
        router.push("/customer");
      } else if (data.user.role === "agent") {
        router.push("/agent");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="customer-start-page min-h-screen bg-[#f7f7f2] flex flex-col text-[#17211d]">
      {/* Header */}
      <header className="customer-start-header sticky top-0 z-30 border-b border-black/5 bg-[#f7f7f2]/95 px-5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ShopifyLogoMark size={30} className="h-[30px] w-[30px] object-contain" />
            <span className="text-[15px] font-bold text-[#101713]">Shopify Support</span>
          </Link>

          <div className="customer-start-tabs flex items-center gap-1 rounded-full border border-[#dfe4dc] bg-white/70 p-1 text-xs sm:gap-2">
            <button
              onClick={() => setActiveTab("onboarding")}
              className={`rounded-full px-3 py-2 font-semibold transition sm:px-4 ${
                activeTab === "onboarding"
                  ? "bg-[#17211d] text-white"
                  : "text-[#5c5f62] hover:bg-[#f2f5f0]"
              }`}
            >
              New Merchant
            </button>
            <button
              onClick={() => setActiveTab("login")}
              className={`rounded-full px-3 py-2 font-semibold transition sm:px-4 ${
                activeTab === "login"
                  ? "bg-[#17211d] text-white"
                  : "text-[#5c5f62] hover:bg-[#f2f5f0]"
              }`}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-start gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:py-16">
        <aside className="customer-start-intro lg:sticky lg:top-28">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#16845f]">Merchant support</p>
          <h1 className="max-w-lg font-serif text-[36px] leading-[1.08] tracking-[-0.025em] text-[#17211d] sm:text-[44px]">
            {activeTab === "onboarding" ? "Your store’s support starts here." : "Welcome back to your support space."}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#626d65] sm:text-base sm:leading-7">
            {activeTab === "onboarding"
              ? "Create your merchant account to connect with a specialist, open support requests, and keep every store conversation together."
              : "Sign in to pick up where you left off and see the latest on your store’s support."}
          </p>
          <div className="mt-8 border-t border-[#dfe4dc] pt-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#334138]">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e5f1df] text-[#16845f]"><ShieldCheck className="h-4 w-4" /></span>
              Your store and support context, together
            </div>
            <p className="mt-3 max-w-sm pl-12 text-xs leading-5 text-[#6a756d]">
              A dedicated workspace for tickets, service requests, and direct replies from your support team.
            </p>
          </div>
          <div className="mt-8 hidden max-w-sm items-center gap-3 rounded-lg border border-[#dfe4dc] bg-white/70 p-4 lg:flex">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f8e9df] text-[#b65f42]"><Headphones className="h-5 w-5" /></span>
            <div>
              <div className="text-xs font-semibold text-[#334138]">A real person, on your side</div>
              <div className="mt-1 text-[11px] leading-4 text-[#758078]">Your requests stay connected to an assigned specialist.</div>
            </div>
          </div>
        </aside>

        <section className="min-w-0" aria-label={activeTab === "onboarding" ? "Create a merchant account" : "Sign in to your merchant account"}>
        {activeTab === "login" ? (
          /* Sign In Card */
          <div className="customer-start-panel bg-white border border-[#dfe4dc] rounded-xl shadow-[0_18px_55px_-38px_rgba(19,43,31,0.42)] p-5 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#eef6df] text-[#5E8E3E] flex items-center justify-center mx-auto mb-3">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-[#000000]">Merchant Account Login</h1>
              <p className="text-sm text-[#6d7175] mt-1">
                Access your Shopify support tickets, service requests, and dedicated agent chat.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent bg-white"
                    placeholder="merchant@yourbrand.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#008060] hover:bg-[#004c3f] text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-xs flex items-center justify-center gap-2"
              >
                {loginLoading ? "Authenticating..." : "Sign In to Shopify Support"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Multi-Step Customer Onboarding Flow */
          <div className="customer-start-panel bg-white border border-[#dfe4dc] rounded-xl shadow-[0_18px_55px_-38px_rgba(19,43,31,0.42)] p-5 sm:p-8">
            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-medium text-[#6d7175] mb-2">
                <span>Step {step} of 2</span>
                <span className="text-[#008060] font-semibold">
                  {step === 1 ? "Account" : "Store & support"}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#008060] h-full transition-all duration-300"
                  style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            {/* STEP 1: Email & Password */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-bold text-[#202223]">Create your support account</h2>
                  <p className="text-xs text-[#6d7175] mt-0.5">
                    Enter your merchant email to begin onboarding your online store.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Merchant Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="founder@mystore.com"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-[#004c3f] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#008060]" />
                  <span>Secure email-based verification & session management.</span>
                </div>
              </div>
            )}

            {/* STEP 2: Customer Information */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#202223]">Merchant & Business Details</h2>
                  <p className="text-xs text-[#6d7175] mt-0.5">
                    Tell us about yourself and your business so we can tailor our support architecture.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Henrik Larsson"
                    className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Business / Brand Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Arctic Wool Essentials"
                    className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Shopify store URL</label>
                  <input
                    type="url"
                    value={formData.storeUrl}
                    onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                    placeholder="https://yourstore.myshopify.com"
                    className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">What do you need help with? (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.primaryGoals}
                    onChange={(e) => setFormData({ ...formData, primaryGoals: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                    placeholder="A brief note helps your assigned specialist prepare."
                  />
                </div>

                <fieldset className="space-y-2">
                  <legend className="block text-xs font-semibold text-[#202223] mb-1">Do you already have a support ticket number?</legend>
                  <div className="flex flex-wrap gap-4 text-xs text-[#4a4d52]">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="existingTicket" checked={hasExistingTicket} onChange={() => setHasExistingTicket(true)} />
                      Yes, I have one
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="existingTicket" checked={!hasExistingTicket} onChange={() => setHasExistingTicket(false)} />
                      No, create one for me
                    </label>
                  </div>
                  {hasExistingTicket && (
                    <input
                      type="text"
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value)}
                      placeholder="Ticket number"
                      className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                    />
                  )}
                </fieldset>

                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-[#202223]">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" checked={formData.termsAccepted} onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })} />
                    <span>I agree to the Shopify Support Terms of Service.</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" checked={formData.privacyPolicyAccepted} onChange={(e) => setFormData({ ...formData, privacyPolicyAccepted: e.target.checked })} />
                    <span>I acknowledge the Merchant Privacy Notice.</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" checked={formData.supportPolicyAccepted} onChange={(e) => setFormData({ ...formData, supportPolicyAccepted: e.target.checked })} />
                    <span>I agree to receive operational support updates.</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: Shopify Store Information */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#202223]">Shopify Store Information</h2>
                  <p className="text-xs text-[#6d7175] mt-0.5">
                    Connect your store context. (We NEVER ask for Shopify passwords or store admin credentials).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Shopify Store URL / Domain</label>
                  <input
                    type="text"
                    value={formData.storeUrl}
                    onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                    placeholder="https://mystore.myshopify.com"
                    className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#202223] mb-1">Niche / Category</label>
                    <select
                      value={formData.storeCategory}
                      onChange={(e) => setFormData({ ...formData, storeCategory: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg bg-white focus:ring-2 focus:ring-[#008060]"
                    >
                      <option>Fashion & Apparel</option>
                      <option>Beauty & Wellness</option>
                      <option>Home & Living</option>
                      <option>Electronics & Gadgets</option>
                      <option>Food & Beverage</option>
                      <option>Sports & Outdoors</option>
                      <option>Jewelry & Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#202223] mb-1">Business Stage</label>
                    <select
                      value={formData.businessStage}
                      onChange={(e) => setFormData({ ...formData, businessStage: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg bg-white focus:ring-2 focus:ring-[#008060]"
                    >
                      <option>Pre-launch / Planning</option>
                      <option>Early Stage (&lt;$10k/mo)</option>
                      <option>Growing ($10k-$50k/mo)</option>
                      <option>Scaling ($50k-$200k/mo)</option>
                      <option>Enterprise ($200k+/mo)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">Primary Support & Service Goals</label>
                  <textarea
                    rows={2}
                    value={formData.primaryGoals}
                    onChange={(e) => setFormData({ ...formData, primaryGoals: e.target.value })}
                    placeholder="e.g. Redesign homepage, fix checkout drop-off, speed up mobile loading"
                    className="w-full px-3 py-2 text-sm border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Terms and Privacy Consent */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#202223]">Terms & Privacy Consent</h2>
                  <p className="text-xs text-[#6d7175] mt-0.5">
                    We maintain strict data privacy standards. Individual consent records are logged in the database.
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#202223]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                      className="mt-0.5 rounded text-[#008060] focus:ring-[#008060]"
                    />
                    <span>
                      I agree to the <strong>Shopify Support Terms of Service</strong> for merchant support and technical services.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privacyPolicyAccepted}
                      onChange={(e) => setFormData({ ...formData, privacyPolicyAccepted: e.target.checked })}
                      className="mt-0.5 rounded text-[#008060] focus:ring-[#008060]"
                    />
                    <span>
                      I acknowledge the <strong>Merchant Privacy Notice</strong> and understand that customer support conversations are securely stored and audited.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.supportPolicyAccepted}
                      onChange={(e) => setFormData({ ...formData, supportPolicyAccepted: e.target.checked })}
                      className="mt-0.5 rounded text-[#008060] focus:ring-[#008060]"
                    />
                    <span>
                      I consent to receive essential operational communications regarding my support tickets and service requests.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 5: Notification Setup & Communication Preferences */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#202223]">Notification Setup & Preferences</h2>
                  <p className="text-xs text-[#6d7175] mt-0.5">
                    Shopify Support uses notifications to let you know when your support agent replies, your ticket status changes, or your service request is updated.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-xs text-[#004c3f] flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-[#008060]" /> Browser / Device Push Notifications
                      </div>
                      <p className="text-[11px] text-[#004c3f] mt-1">
                        Receive instant desktop and mobile notifications when an agent responds.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={requestBrowserNotification}
                      className="bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0"
                    >
                      Enable Browser Alerts
                    </button>
                  </div>
                </div>

                {/* Preference separation (Core requirement: Support vs Marketing separated!) */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Communication Preferences
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <div>
                      <div className="text-xs font-semibold text-[#202223]">Support Inbox Updates</div>
                      <div className="text-[11px] text-gray-500">In-app badges when tickets or services change</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notificationPrefs.supportInbox}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationPrefs: {
                            ...formData.notificationPrefs,
                            supportInbox: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#008060]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <div>
                      <div className="text-xs font-semibold text-[#202223]">Email Support Updates</div>
                      <div className="text-[11px] text-gray-500">Secure email notifications with link to chat</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notificationPrefs.emailSupport}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationPrefs: {
                            ...formData.notificationPrefs,
                            emailSupport: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#008060]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-xs font-semibold text-[#202223]">Marketing & Promotional Emails</div>
                      <div className="text-[11px] text-gray-500">Separate marketing updates (optional)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.marketingConsent}
                      onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                      className="rounded text-[#008060]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Confirmation & Generating Customer ID */}
            {step === 6 && (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#008060] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#202223]">Ready to Issue Your Customer ID</h2>
                  <p className="text-xs text-[#6d7175] mt-1 max-w-md mx-auto">
                    Your authenticated merchant account will be generated in format:
                    <span className="font-mono font-bold text-[#008060] block text-sm mt-1">
                      SHOP-CUST-XXXXXX
                    </span>
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-left text-xs max-w-md mx-auto space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Brand Name:</span>
                    <span className="font-semibold">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Merchant Email:</span>
                    <span className="font-semibold">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Store URL:</span>
                    <span className="font-mono text-emerald-700">{formData.storeUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform:</span>
                    <span className="font-semibold">Shopify</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step Controls */}
            <div className="mt-8 pt-4 border-t border-[#e1e3e5] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteOnboarding}
                  className="px-6 py-2.5 bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 shadow-xs"
                >
                  {loading ? "Creating your account and support chat..." : "Create account & open support chat"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
        </section>
      </main>
    </div>
  );
}
