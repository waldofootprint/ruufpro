// Shared data resolver for Riley standalone chat page.
// Resolves both UUID paths (backward compat for riley.js) and slug paths (new shareable URLs).

import { createClient } from "@supabase/supabase-js";

export interface ChatPageData {
  contractorId: string;
  businessName: string;
  phone: string | null;
  logoUrl: string | null;
  city: string;
  state: string;
  accentColor: string;
  customGreeting: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getChatData(identifier: string): Promise<ChatPageData | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const isUUID = UUID_PATTERN.test(identifier);

  // Query contractor by UUID or slug
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, phone, logo_url, city, state, has_ai_chatbot")
    .eq(isUUID ? "id" : "slug", identifier)
    .single();

  if (!contractor || !contractor.has_ai_chatbot) {
    return null;
  }

  // Fetch chatbot config for greeting
  const { data: config } = await supabase
    .from("chatbot_config")
    .select("greeting_message")
    .eq("contractor_id", contractor.id)
    .maybeSingle();

  return {
    contractorId: contractor.id,
    businessName: contractor.business_name
      .replace(/\s*(LLC|Inc\.?|Corp\.?|L\.?L\.?C\.?|PLLC)\s*$/i, "")
      .trim(),
    phone: contractor.phone || null,
    logoUrl: contractor.logo_url || null,
    city: contractor.city,
    state: contractor.state,
    accentColor: "#6366f1",
    customGreeting: config?.greeting_message || null,
  };
}
