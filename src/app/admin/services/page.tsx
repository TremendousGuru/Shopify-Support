"use client";

import { useEffect, useState } from "react";
import { Layers, Sparkles, Clock, CheckCircle2, Plus, Pencil, Trash2, EyeOff, Save } from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  services?: Service[];
};

type Service = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  startingPrice?: number | null;
  estimatedDays?: string | null;
  features?: string | null;
  isActive?: boolean | null;
  displayOrder: number;
};

const emptyServiceForm = {
  categoryId: "",
  name: "",
  shortDescription: "",
  fullDescription: "",
  startingPrice: "0",
  estimatedDays: "2-4 days",
  features: "",
};

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyServiceForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    try {
      const response = await fetch("/api/admin/services");
      const data = await response.json();
      setCategories(data.categories || []);
      setServices(data.services || []);
      setCanManage(data.canManage === true);
      if (data.canManage) {
        const proposalResponse = await fetch("/api/admin/service-proposals");
        const proposalData = await proposalResponse.json();
        if (proposalResponse.ok) setProposals(proposalData.proposals || []);
      }
      if (data.categories?.[0]) {
        setForm((current) => ({ ...current, categoryId: data.categories[0].id }));
      }
    } catch (error) {
      console.error("Failed to load service catalog", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchCatalog);
  }, []);

  const handleReviewProposal = async (proposalId: string, decision: "approve" | "reject") => {
    setReviewingId(proposalId);
    try {
      const response = await fetch("/api/admin/service-proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not review proposal");
      await fetchCatalog();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Could not review proposal");
    } finally {
      setReviewingId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const price = Number(form.startingPrice);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
      setFormError("Enter a valid non-negative whole-number price.");
      return;
    }
    setFormError(null);
    setSaving(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const payload = {
        ...(editingId ? { serviceId: editingId } : {}),
        categoryId: form.categoryId,
        name: form.name,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        startingPrice: price,
        estimatedDays: form.estimatedDays,
        features: form.features,
      };

      const response = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save service");
      }

      setForm(emptyServiceForm);
      setEditingId(null);
      await fetchCatalog();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      categoryId: service.categoryId,
      name: service.name,
      shortDescription: service.shortDescription || "",
      fullDescription: service.fullDescription || "",
      startingPrice: String(service.startingPrice ?? 0),
      estimatedDays: service.estimatedDays || "2-4 days",
      features: service.features || "",
    });
  };

  const handleToggleStatus = async (serviceId: string, nextState: boolean) => {
    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, isActive: nextState }),
      });

      if (response.ok) {
        await fetchCatalog();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (serviceId: string) => {
    const confirmed = window.confirm("Remove this service from the public Shopify catalog?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/services?serviceId=${encodeURIComponent(serviceId)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCatalog();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const activeServices = services.filter((service) => service.isActive !== false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          Shopify Service Catalog ({activeServices.length} live services)
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage catalog items, pricing, and availability for all storefront portals.
        </p>
      </div>

      {!canManage && <p className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-400">Only a system administrator can publish or modify catalog services.</p>}

      {canManage && <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="w-4 h-4 text-purple-400" />
          {editingId ? "Edit Service" : "Add New Service"}
        </div>

        {formError && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-200">{formError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Service name</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              placeholder="e.g. Bug Fixing"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Short description</label>
          <input
            value={form.shortDescription}
            onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Full description</label>
          <textarea
            value={form.fullDescription}
            onChange={(event) => setForm({ ...form, fullDescription: event.target.value })}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Starting price</label>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              required
              value={form.startingPrice}
              onChange={(event) => setForm({ ...form, startingPrice: event.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Estimated time</label>
            <input
              value={form.estimatedDays}
              onChange={(event) => setForm({ ...form, estimatedDays: event.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Key features</label>
            <input
              value={form.features}
              onChange={(event) => setForm({ ...form, features: event.target.value })}
              placeholder="Comma separated list"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || categories.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#95BF47] px-4 py-2 text-sm font-semibold text-slate-900"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : editingId ? "Update Service" : "Add Service"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyServiceForm);
              }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>}

      {canManage && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Agent proposals awaiting review</h2>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{proposals.filter((proposal) => proposal.status === "pending").length} pending</span>
          </div>
          {proposals.filter((proposal) => proposal.status === "pending").length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-xs text-slate-400">No pending service proposals.</div>
          ) : proposals.filter((proposal) => proposal.status === "pending").map((proposal) => (
            <article key={proposal.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white">{proposal.name}</div>
                  <div className="mt-1 text-[11px] text-emerald-300">{proposal.categoryName} · submitted by {proposal.agentName} ({proposal.agentCode})</div>
                  <p className="mt-2 text-xs text-slate-300">{proposal.shortDescription}</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-slate-400">{proposal.fullDescription}</p>
                  <div className="mt-2 text-xs text-slate-300">${proposal.startingPrice} USD · {proposal.estimatedDays}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={reviewingId === proposal.id} onClick={() => handleReviewProposal(proposal.id, "approve")} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Approve and publish</button>
                  <button disabled={reviewingId === proposal.id} onClick={() => handleReviewProposal(proposal.id, "reject")} className="rounded-md border border-red-800 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-40">Reject</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryServices = services.filter((service) => service.categoryId === category.id && service.isActive !== false);

          return (
            <div key={category.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    {category.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono">
                  {categoryServices.length} live items
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryServices.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-dashed border-slate-700 px-3 py-4 text-xs text-slate-400">
                    No active services in this category.
                  </div>
                ) : (
                  categoryServices.map((service) => (
                    <div key={service.id} className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-4 space-y-2 hover:border-slate-600 transition">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-xs text-white">{service.name}</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          ${service.startingPrice ?? 0} USD
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{service.shortDescription}</p>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Turnaround: {service.estimatedDays}</span>
                      </div>

                      {canManage && <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[10px] text-slate-200"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(service.id, false)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[10px] text-slate-200"
                        >
                          <EyeOff className="w-3 h-3" />
                          Hide
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-800 bg-red-950/60 px-2 py-1 text-[10px] text-red-200"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
