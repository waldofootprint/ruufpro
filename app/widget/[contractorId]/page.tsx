// Hosted widget page — renders the estimate widget for a specific contractor.
// Accessed via iframe from external sites using the embed script.
// URL: /widget/[contractorId]
// Guard: if contractor hasn't configured pricing, show a friendly message instead of broken widget.

import { createServerSupabase } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

export default async function WidgetPage({
  params,
}: {
  params: { contractorId: string };
}) {
  const supabase = createServerSupabase();

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, phone, has_estimate_widget")
    .eq("id", params.contractorId)
    .single();

  if (!contractor) {
    notFound();
  }

  // Guard: widget must be enabled (Pro+ tier)
  if (!contractor.has_estimate_widget) {
    return (
      <main className="min-h-screen bg-transparent flex items-center justify-center p-8">
        <p className="text-gray-400 text-sm text-center">
          Estimate widget is not available for this contractor.
        </p>
      </main>
    );
  }

  // Guard: contractor must have configured pricing
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: settings } = await serviceSupabase
    .from("estimate_settings")
    .select("asphalt_low, asphalt_high, brand_primary_hex")
    .eq("contractor_id", contractor.id)
    .single();

  const hasPricing = settings && (settings.asphalt_low > 0 || settings.asphalt_high > 0);

  if (!hasPricing) {
    return (
      <main className="min-h-screen bg-transparent flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-1">
            {contractor.business_name}
          </p>
          <p className="text-gray-400 text-xs">
            Estimates coming soon. Call us at{" "}
            <a href={`tel:${contractor.phone}`} className="text-blue-500 underline">
              {contractor.phone}
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent p-4">
      <EstimateWidgetV4
        contractorId={contractor.id}
        contractorName={contractor.business_name}
        contractorPhone={contractor.phone}
        accentColor={settings?.brand_primary_hex || undefined}
      />
    </main>
  );
}
