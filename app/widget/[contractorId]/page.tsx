// Hosted widget page — renders the estimate widget for a specific contractor.
// Accessed via iframe from external sites using the embed script.
// URL: /widget/[contractorId]

import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import EstimateWidget from "@/components/estimate-widget";

export default async function WidgetPage({
  params,
}: {
  params: { contractorId: string };
}) {
  const supabase = createServerSupabase();

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, phone")
    .eq("id", params.contractorId)
    .single();

  if (!contractor) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-transparent p-4">
      <EstimateWidget
        contractorId={contractor.id}
        contractorName={contractor.business_name}
        contractorPhone={contractor.phone}
      />
    </main>
  );
}
