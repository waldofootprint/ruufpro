// Claim page — prospect claims a pre-built outreach site.
// URL: /claim/{slug}
// Shows business name + signup form. Links auth user to existing contractor.

import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ClaimForm from "./ClaimForm";

export default async function ClaimPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabase();

  // Look up the site by slug
  const { data: site } = await supabase
    .from("sites")
    .select("slug, contractors(id, business_name, city, state, user_id)")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!site) notFound();

  const contractor = Array.isArray(site.contractors)
    ? site.contractors[0]
    : site.contractors;

  if (!contractor) notFound();

  // Already claimed — redirect to login
  if (contractor.user_id) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            This site has already been claimed
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {contractor.business_name} is already set up on RuufPro.
          </p>
          <a
            href="/login"
            className="inline-block rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            Log In
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎁</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            We built a website for {contractor.business_name}
          </h1>
          <p className="text-gray-500 text-sm">
            It&apos;s free to keep. Claim it now and get 14 days of Pro features
            (estimate widget, AI chatbot, review automation) — no credit card required.
          </p>
        </div>

        {/* Preview link */}
        <a
          href={`/site/${params.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-6 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition text-center"
        >
          <p className="text-xs text-gray-400 mb-1">Your site preview</p>
          <p className="text-sm font-semibold text-indigo-600">
            {params.slug}.ruufpro.com →
          </p>
        </a>

        <ClaimForm
          slug={params.slug}
          contractorId={contractor.id}
          businessName={contractor.business_name}
        />

        <p className="text-center text-xs text-gray-400 mt-4">
          Free forever. Pro trial for 14 days. No credit card.
        </p>
      </div>
    </main>
  );
}
