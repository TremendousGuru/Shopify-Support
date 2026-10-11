"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Store } from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

export default function CustomerStartPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"onboarding" | "login">("onboarding");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [ticketChoice, setTicketChoice] = useState<"existing" | "none" | null>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ conversationId: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleCompleteOnboarding = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Choose a password with at least 8 characters.");
    if (!businessName.trim()) return setError("Enter your business name.");
    if (!ticketChoice) return setError("Choose whether you have an existing ticket ID.");
    if (ticketChoice === "existing" && !ticketNumber.trim()) return setError("Enter your existing ticket ID.");

    setLoading(true);
    try {
      const response = await fetch("/api/auth/customer-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          businessName: businessName.trim(),
          existingTicketNumber: ticketChoice === "existing" ? ticketNumber.trim() : "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create your account.");
      setCreated({ conversationId: data.conversationId });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, portal: "/customer" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      router.push(data.portal || "/customer");
      router.refresh();
    } catch (cause) {
      setLoginError(cause instanceof Error ? cause.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#17211d]">
      <header className="border-b border-black/5 px-5 sm:px-8">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><ShopifyLogoMark size={30} className="h-[30px] w-[30px] object-contain" /><span className="text-[15px] font-bold">Shopify Support</span></Link>
          <div className="flex gap-1 rounded-full border border-[#dfe4dc] bg-white/70 p-1 text-xs">
            <button onClick={() => setActiveTab("onboarding")} className={`rounded-full px-4 py-2 font-semibold ${activeTab === "onboarding" ? "bg-[#17211d] text-white" : "text-[#5c5f62]"}`}>New Merchant</button>
            <button onClick={() => setActiveTab("login")} className={`rounded-full px-4 py-2 font-semibold ${activeTab === "login" ? "bg-[#17211d] text-white" : "text-[#5c5f62]"}`}>Sign In</button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-7xl items-start gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:py-16">
        <aside className="lg:sticky lg:top-10">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#16845f]">Merchant support</p>
          <h1 className="max-w-lg font-serif text-4xl leading-tight">{activeTab === "onboarding" ? "Your store’s support starts here." : "Welcome back to your support space."}</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#626d65]">{activeTab === "onboarding" ? "Create your account and connect with a Shopify support specialist." : "Sign in to continue your support conversations."}</p>
        </aside>
        <section className="min-w-0 rounded-xl border border-[#dfe4dc] bg-white p-5 shadow-sm sm:p-8">
          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><h2 className="text-xl font-bold">Merchant Account Login</h2><p className="mt-1 text-sm text-[#6d7175]">Use the email and password from your account setup.</p></div>
              {loginError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loginError}</p>}
              <label className="block text-sm font-semibold">Email Address<div className="relative mt-1"><Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400"/><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full rounded-lg border border-[#e1e3e5] py-2 pl-9 pr-3" autoComplete="email"/></div></label>
              <label className="block text-sm font-semibold">Password<div className="relative mt-1"><Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400"/><input type={showLoginPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full rounded-lg border border-[#e1e3e5] py-2 pl-9 pr-11" autoComplete="current-password"/><button type="button" onClick={() => setShowLoginPassword((shown) => !shown)} aria-label={showLoginPassword ? "Hide password" : "Show password"} aria-pressed={showLoginPassword} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-800"><span className="sr-only">{showLoginPassword ? "Hide password" : "Show password"}</span>{showLoginPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button></div></label>
              <button disabled={loginLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#008060] py-3 text-sm font-semibold text-white disabled:opacity-60">{loginLoading ? "Signing in…" : "Sign in"}<ArrowRight className="h-4 w-4"/></button>
            </form>
          ) : created ? (
            <div className="space-y-5">
              <div><h2 className="text-xl font-bold">Your support account is ready</h2><p className="mt-1 text-sm leading-6 text-[#626d65]">Your account has been created. Continue to your support chat.</p></div>
              <button onClick={() => { router.push(`/customer/messages?conversationId=${encodeURIComponent(created.conversationId)}`); router.refresh(); }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#008060] py-3 text-sm font-semibold text-white">Open support chat<ArrowRight className="h-4 w-4"/></button>
            </div>
          ) : (
            <form onSubmit={handleCompleteOnboarding} className="space-y-5">
              <div><h2 className="text-xl font-bold">Create your support account</h2><p className="mt-1 text-sm text-[#6d7175]">Just the details we need to get you to the right support agent.</p></div>
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <label className="block text-sm font-semibold">Email address<div className="relative mt-1"><Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400"/><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email" className="w-full rounded-lg border border-[#e1e3e5] py-2.5 pl-9 pr-3"/></div></label>
              <label className="block text-sm font-semibold">Password<div className="relative mt-1"><Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400"/><input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" className="w-full rounded-lg border border-[#e1e3e5] py-2.5 pl-9 pr-11"/><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-800"><span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button></div></label>
              <label className="block text-sm font-semibold">Business name<div className="relative mt-1"><Store className="absolute left-3 top-3 h-4 w-4 text-gray-400"/><input type="text" required maxLength={160} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business" autoComplete="organization" className="w-full rounded-lg border border-[#e1e3e5] py-2.5 pl-9 pr-3"/></div></label>
              <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Do you already have a support ticket ID?</legend><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e1e3e5] p-3 text-sm"><input type="radio" name="ticketChoice" checked={ticketChoice === "existing"} onChange={() => setTicketChoice("existing")}/>Yes, I have a ticket ID</label><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e1e3e5] p-3 text-sm"><input type="radio" name="ticketChoice" checked={ticketChoice === "none"} onChange={() => setTicketChoice("none")}/>I don’t have one</label></fieldset>
              {ticketChoice === "existing" && <label className="block text-sm font-semibold">Existing ticket ID<input type="text" required maxLength={64} value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} placeholder="Ticket ID" className="mt-1 w-full rounded-lg border border-[#e1e3e5] px-3 py-2.5"/></label>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#008060] py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Creating your account…" : "Create account & continue"}<ArrowRight className="h-4 w-4"/></button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
