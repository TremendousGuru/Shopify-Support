"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Palette,
  Gauge,
  SearchCheck,
  Compass,
  HeartHandshake,
  TrendingUp,
  Zap,
  Wrench,
  Target,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CustomerServicesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Request modal state
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [storeUrl, setStoreUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [goals, setGoals] = useState<string>("");
  const [desiredTimeframe, setDesiredTimeframe] = useState<string>("2-3 weeks");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (service: any) => {
    setSelectedService(service);
    setDescription(`Requesting: ${service.name}.\n`);
    setRequestSuccess(null);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          storeUrl,
          description,
          goals,
          desiredTimeframe,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRequestSuccess(`Request ${data.request.requestCode} created successfully!`);
        setTimeout(() => {
          setSelectedService(null);
          router.push("/customer/service-requests");
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const allServicesList = categories.flatMap((c) =>
    (c.services || []).map((s: any) => ({ ...s, categoryName: c.name, categorySlug: c.slug }))
  );

  const filteredServices =
    selectedCategory === "all"
      ? allServicesList
      : allServicesList.filter((s) => s.categorySlug === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#008060]" />
          Shopify Ecommerce Service Catalog
        </h1>
        <p className="text-xs text-[#6d7175] mt-0.5">
          Specialized store redesigns, speed overhauls, conversion audits, and custom Liquid development.
        </p>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === "all"
              ? "bg-[#008060] text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          All Categories ({allServicesList.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.slug)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === c.slug
                ? "bg-[#008060] text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Service Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading catalog services...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            let parsedFeatures: string[] = [];
            try {
              parsedFeatures = service.features ? JSON.parse(service.features) : [];
            } catch {
              parsedFeatures = [];
            }

            return (
              <div
                key={service.id}
                className="bg-white border border-[#e1e3e5] rounded-xl p-5 hover:border-[#008060] hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#008060] bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-2">
                    {service.categoryName}
                  </div>

                  <h3 className="text-base font-bold text-[#202223]">{service.name}</h3>
                  <p className="text-xs text-[#6d7175] mt-1.5 leading-relaxed">
                    {service.shortDescription}
                  </p>

                  {/* Pricing and Turnaround */}
                  <div className="flex items-center justify-between py-3 my-3 border-y border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Starting at</span>
                      <span className="text-base font-extrabold text-[#202223]">
                        ${service.startingPrice || 650}
                      </span>
                      <span className="text-[10px] text-gray-500"> USD</span>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 text-[10px] block">Estimated time</span>
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {service.estimatedDays || "5-7 days"}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  {parsedFeatures.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      {parsedFeatures.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#008060] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenModal(service)}
                  className="w-full bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold py-2.5 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 mt-2"
                >
                  Request This Service <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Service Request Drawer / Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e1e3e5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e5]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#008060]">
                  New Service Request
                </span>
                <h2 className="text-base font-bold text-[#202223]">{selectedService.name}</h2>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {requestSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-[#004c3f] text-xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008060]" />
                {requestSuccess}
              </div>
            )}

            <form onSubmit={handleServiceSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Shopify Storefront URL
                </label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://nordicglow.myshopify.com"
                  className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Project Scope & Specific Requirements
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you want to achieve with this service..."
                  className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">
                    Primary Business Goal
                  </label>
                  <input
                    type="text"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g. Lift mobile conversion by 20%"
                    className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1">
                    Desired Timeframe
                  </label>
                  <select
                    value={desiredTimeframe}
                    onChange={(e) => setDesiredTimeframe(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#e1e3e5] rounded-lg bg-white focus:ring-2 focus:ring-[#008060]"
                  >
                    <option>Urgent (Within 3-5 days)</option>
                    <option>Standard (1-2 weeks)</option>
                    <option>Flexible (2-4 weeks)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                <strong>Next Step:</strong> Our Shopify technical lead will review your requirements, inspect your store, and prepare a formal quote/spec for your review.
              </div>

              <div className="pt-3 border-t border-[#e1e3e5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#008060] hover:bg-[#004c3f] text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? "Submitting Request..." : "Submit Service Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
