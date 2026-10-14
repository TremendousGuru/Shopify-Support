"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, CheckCircle2, AlertCircle, Plus, X } from "lucide-react";

export default function AgentProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me").then(async (response) => {
      const data = await response.json();
      if (active) {
        setDisplayName(data.user?.fullName ?? "");
        setSpecialties((data.user?.agent?.specialties ?? "").split(",").map((item: string) => item.trim()).filter(Boolean));
      }
    }).catch(() => {
      if (active) setError("Could not load your profile. Refresh and try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function addSpecialty() {
    const additions = specialtyInput.split(",").map((item) => item.trim()).filter(Boolean);
    if (!additions.length) return;
    setSpecialties((current) => {
      const seen = new Set(current.map((item) => item.toLocaleLowerCase()));
      return [...current, ...additions.filter((item) => {
        const key = item.toLocaleLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })].slice(0, 12);
    });
    setSpecialtyInput("");
    setSaved(false);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, specialties: specialties.join(", ") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update your display name");
      setDisplayName(data.displayName);
      setSpecialties((data.specialties ?? "").split(",").map((item: string) => item.trim()).filter(Boolean));
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your display name");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent profile</h1>
        <p className="text-sm text-slate-600 mt-1">Choose the name customers and teammates see across the workspace.</p>
      </div>
      <form onSubmit={saveProfile} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-lime-100 text-lime-800 flex items-center justify-center"><UserRound className="w-5 h-5" /></div>
          <div><h2 className="font-semibold text-slate-900">Display name</h2><p className="text-xs text-slate-500">Your sign-in email and agent account remain unchanged.</p></div>
        </div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="displayName">Name shown in the app
          <input id="displayName" value={displayName} onChange={(event) => { setDisplayName(event.target.value); setSaved(false); }} disabled={loading || saving} maxLength={60} required minLength={2} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-lime-600 focus:ring-2 focus:ring-lime-100 disabled:bg-slate-50" />
        </label>
        <section aria-labelledby="specialties-heading" className="space-y-3 border-t border-slate-100 pt-5">
          <div>
            <h2 id="specialties-heading" className="font-semibold text-slate-900">Your specialities</h2>
            <p className="mt-1 text-xs text-slate-500">Customers can see these on your support profile. Add or remove up to 12 specialities as your expertise changes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <span key={specialty} className="inline-flex items-center gap-1.5 rounded-full bg-lime-50 px-3 py-1.5 text-xs font-medium text-slate-800">
                {specialty}
                <button type="button" disabled={saving} onClick={() => { setSpecialties((items) => items.filter((item) => item !== specialty)); setSaved(false); }} aria-label={`Remove ${specialty}`} className="rounded-full p-0.5 text-slate-500 hover:bg-lime-100 hover:text-red-700 disabled:opacity-50"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
            {specialties.length === 0 && <p className="text-xs text-slate-500">No specialities added yet.</p>}
          </div>
          <div className="flex gap-2">
            <input value={specialtyInput} onChange={(event) => setSpecialtyInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSpecialty(); } }} disabled={loading || saving} maxLength={60} placeholder="e.g. Theme customization" aria-label="Add a speciality" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-lime-600 focus:ring-2 focus:ring-lime-100 disabled:bg-slate-50" />
            <button type="button" onClick={addSpecialty} disabled={loading || saving || !specialtyInput.trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Plus className="h-4 w-4" />Add</button>
          </div>
        </section>
        {error && <p role="alert" className="flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4" />{error}</p>}
        {saved && <p role="status" className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 className="w-4 h-4" />Profile updated.</p>}
        <button type="submit" disabled={loading || saving} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button>
      </form>
    </div>
  );
}
