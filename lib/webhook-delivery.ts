import { createServerSupabase } from "@/lib/supabase-server";

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  message?: string;
  source: string;
  estimate_low?: number;
  estimate_high?: number;
  estimate_material?: string;
  estimate_roof_sqft?: number;
  estimate_pitch_degrees?: number;
  timeline?: string;
  financing_interest?: string;
  created_at: string;
}

export async function deliverLeadWebhook(
  contractorId: string,
  leadData: LeadData
): Promise<void> {
  try {
    const supabase = createServerSupabase();

    const { data: contractor } = await supabase
      .from("contractors")
      .select("webhook_url, webhook_enabled")
      .eq("id", contractorId)
      .single();

    if (!contractor?.webhook_enabled || !contractor?.webhook_url) {
      return;
    }

    // Fire-and-forget — don't block the lead creation flow
    fetch(contractor.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "lead.created",
        timestamp: new Date().toISOString(),
        data: leadData,
      }),
    }).catch((err) => {
      console.error(`Webhook delivery failed for contractor ${contractorId}:`, err);
    });
  } catch (err) {
    console.error("Webhook delivery error:", err);
  }
}
