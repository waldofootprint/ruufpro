// Onboarding flow — 3 steps on one page:
// Step 1: Pick a design style (visual look for the site)
// Step 2: Enter business info (name, phone, city, state)
// Step 3: Confirm & publish
//
// All templates are residential-focused. The roofer picks a visual style,
// not a business type. Business type defaults to "residential".

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DesignStyle = "modern_clean" | "bold_confident" | "warm_trustworthy";

const DESIGN_OPTIONS = [
  {
    id: "modern_clean" as DesignStyle,
    name: "Modern Clean",
    description:
      "White space, subtle shadows, minimal color, elegant typography. Professional and polished.",
    vibe: "Upscale & refined",
    color: "border-gray-300 bg-white",
    selectedColor: "border-brand-500 bg-brand-50 ring-2 ring-brand-500",
    preview: "bg-gradient-to-br from-white to-gray-100",
  },
  {
    id: "bold_confident" as DesignStyle,
    name: "Bold & Confident",
    description:
      "Darker tones, strong contrast, prominent CTAs, bold imagery. Commands authority and trust.",
    vibe: "Established & powerful",
    color: "border-gray-300 bg-white",
    selectedColor: "border-gray-800 bg-gray-50 ring-2 ring-gray-800",
    preview: "bg-gradient-to-br from-gray-800 to-gray-900",
  },
  {
    id: "warm_trustworthy" as DesignStyle,
    name: "Warm & Trustworthy",
    description:
      "Earthy tones, friendly feel, community-oriented. Your local neighborhood roofer.",
    vibe: "Local & approachable",
    color: "border-gray-300 bg-white",
    selectedColor: "border-amber-600 bg-amber-50 ring-2 ring-amber-600",
    preview: "bg-gradient-to-br from-amber-50 to-amber-100",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [designStyle, setDesignStyle] = useState<DesignStyle>("modern_clean");
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
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
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

    // Create the contractor row (always residential)
    const { data: contractor, error: contractorErr } = await supabase
      .from("contractors")
      .insert({
        user_id: userId,
        email: (await supabase.auth.getUser()).data.user?.email || "",
        business_name: businessName,
        phone,
        city,
        state,
        business_type: "residential",
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

    // Create the site with the chosen design style
    const { error: siteErr } = await supabase.from("sites").insert({
      contractor_id: contractor.id,
      slug,
      template: designStyle,
      published: true,
    });

    if (siteErr) {
      if (siteErr.message.includes("duplicate")) {
        setError(
          `The URL "${slug}.ruufpro.com" is taken. Try a different business name.`
        );
      } else {
        setError(siteErr.message);
      }
      setLoading(false);
      return;
    }

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

        {/* ===== STEP 1: Pick Design Style ===== */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Choose your site's look
            </h1>
            <p className="text-gray-600 mb-6">
              Pick the style that fits your brand. You can change this anytime.
            </p>

            <div className="space-y-4">
              {DESIGN_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDesignStyle(d.id)}
                  className={`w-full text-left rounded-lg border-2 p-5 transition-all ${
                    designStyle === d.id ? d.selectedColor : d.color
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Color preview swatch */}
                    <div
                      className={`h-14 w-14 rounded-lg ${d.preview} shrink-0`}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {d.name}
                      </div>
                      <div className="mt-0.5 text-sm text-gray-600">
                        {d.description}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {d.vibe}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-[1px] active:scale-[0.98]"
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
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] active:scale-[0.98]"
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
                className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-[1px] active:scale-[0.98]"
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
                <span className="text-sm text-gray-500">Design</span>
                <span className="text-sm font-medium text-gray-900">
                  {DESIGN_OPTIONS.find((d) => d.id === designStyle)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Your URL</span>
                <span className="text-sm font-medium text-brand-600">
                  {generateSlug(businessName)}.ruufpro.com
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] active:scale-[0.98]"
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

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
];
