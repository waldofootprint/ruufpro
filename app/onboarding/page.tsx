// Onboarding flow — 3 steps on one page:
// Step 1: Pick a template (storm_insurance, residential, full_service)
// Step 2: Enter business info (name, phone, city, state)
// Step 3: Confirm & publish
//
// After publish, the roofer's site is live at [slug].roofready.com

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { BusinessType } from "@/lib/types";

// Template options — mapped to business types, not visual styles
const TEMPLATES = [
  {
    id: "storm_insurance" as BusinessType,
    name: "Storm & Insurance",
    description:
      "For roofers who chase storms and handle insurance claims. Urgent CTAs, emergency language, 24/7 availability.",
    headline: "Storm Damage? We're Here to Help.",
    cta: "Get Free Storm Inspection",
    color: "border-red-400 bg-red-50",
    selectedColor: "border-red-500 bg-red-100 ring-2 ring-red-500",
  },
  {
    id: "residential" as BusinessType,
    name: "Residential",
    description:
      "For roofers doing scheduled re-roofs and repairs. Trust-focused, quality-first, professional tone.",
    headline: "Trusted Roofing in Your City",
    cta: "Get Your Free Estimate",
    color: "border-blue-400 bg-blue-50",
    selectedColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-500",
  },
  {
    id: "full_service" as BusinessType,
    name: "Full Service",
    description:
      "For contractors offering roofing + gutters + siding + more. Shows the full range of what you do.",
    headline: "Your Home, Our Expertise",
    cta: "Get Your Free Estimate",
    color: "border-green-400 bg-green-50",
    selectedColor: "border-green-500 bg-green-100 ring-2 ring-green-500",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [template, setTemplate] = useState<BusinessType>("residential");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Check if user is logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/signup");
      } else {
        setUserId(data.user.id);
      }
    });
  }, [router]);

  // Generate a URL-friendly slug from the business name
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove special characters
      .replace(/\s+/g, "-") // spaces to hyphens
      .replace(/-+/g, "-") // collapse multiple hyphens
      .trim();
  }

  async function handlePublish() {
    if (!userId) return;
    setError("");
    setLoading(true);

    const slug = generateSlug(businessName);
    if (!slug) {
      setError("Please enter a valid business name.");
      setLoading(false);
      return;
    }

    // Step 1: Create the contractor row
    const { data: contractor, error: contractorErr } = await supabase
      .from("contractors")
      .insert({
        user_id: userId,
        email: (await supabase.auth.getUser()).data.user?.email || "",
        business_name: businessName,
        phone,
        city,
        state,
        business_type: template,
      })
      .select()
      .single();

    if (contractorErr) {
      if (contractorErr.message.includes("duplicate")) {
        setError("You already have an account set up.");
      } else {
        setError(contractorErr.message);
      }
      setLoading(false);
      return;
    }

    // Step 2: Create the site
    const { error: siteErr } = await supabase.from("sites").insert({
      contractor_id: contractor.id,
      slug,
      template,
      published: true,
    });

    if (siteErr) {
      if (siteErr.message.includes("duplicate")) {
        setError(
          `The URL "${slug}.roofready.com" is taken. Try a different business name.`
        );
      } else {
        setError(siteErr.message);
      }
      setLoading(false);
      return;
    }

    // Success — redirect to their new site
    // In production this would be slug.roofready.com
    // In dev, we go to the site preview page
    router.push(`/site/${slug}`);
  }

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl pt-8">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full ${
                s <= step ? "bg-brand-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ===== STEP 1: Pick Template ===== */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              What type of roofing business do you run?
            </h1>
            <p className="text-gray-600 mb-6">
              This determines your site's content, tone, and default services.
              You can customize everything later.
            </p>

            <div className="space-y-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`w-full text-left rounded-lg border-2 p-5 transition-all ${
                    template === t.id ? t.selectedColor : t.color
                  }`}
                >
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="mt-1 text-sm text-gray-600">
                    {t.description}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Preview headline: "{t.headline}" • CTA: "{t.cta}"
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Continue
            </button>
          </div>
        )}

        {/* ===== STEP 2: Business Info ===== */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Tell us about your business
            </h1>
            <p className="text-gray-600 mb-6">
              Just the basics — your site generates from this. You can add more
              details later.
            </p>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Business Name *
                </span>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Joe's Roofing"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Phone Number *
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="(555) 123-4567"
                />
              </label>

              <div className="grid grid-cols-3 gap-4">
                <label className="block col-span-2">
                  <span className="text-sm font-medium text-gray-700">
                    City *
                  </span>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Dallas"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    State *
                  </span>
                  <select
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">--</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!businessName || !phone || !city || !state) {
                    setError("Please fill in all fields.");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
                className="flex-1 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Confirm & Publish ===== */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to publish?
            </h1>
            <p className="text-gray-600 mb-6">
              Your site will be live instantly. You can edit everything later.
            </p>

            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Business</span>
                <span className="text-sm font-medium text-gray-900">
                  {businessName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium text-gray-900">
                  {phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Location</span>
                <span className="text-sm font-medium text-gray-900">
                  {city}, {state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Template</span>
                <span className="text-sm font-medium text-gray-900">
                  {TEMPLATES.find((t) => t.id === template)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Your URL</span>
                <span className="text-sm font-medium text-brand-600">
                  {generateSlug(businessName)}.roofready.com
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publishing..." : "Publish My Site — It's Free"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// US state abbreviations for the dropdown
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
];
