// Standalone Riley chat page — embeddable via iframe on external sites.
// No layout chrome, no nav. Just the full ChatWidget always open.
// URL: /chat/{contractorId}

import { createClient } from "@supabase/supabase-js";
import StandaloneChatWrapper from "./StandaloneChatWrapper";

interface Props {
  params: Promise<{ contractorId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { contractorId } = await params;

  // Validate UUID format
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(contractorId)) {
    return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Invalid contractor ID</div>;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch contractor + chatbot config for accent color and greeting
  const [contractorRes, configRes] = await Promise.all([
    supabase
      .from("contractors")
      .select("id, business_name, has_ai_chatbot")
      .eq("id", contractorId)
      .eq("has_ai_chatbot", true)
      .single(),
    supabase
      .from("chatbot_config")
      .select("greeting_message")
      .eq("contractor_id", contractorId)
      .maybeSingle(),
  ]);

  if (!contractorRes.data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Chat not available</div>;
  }

  return (
    <StandaloneChatWrapper
      contractorId={contractorRes.data.id}
      businessName={contractorRes.data.business_name}
      customGreeting={configRes.data?.greeting_message || null}
    />
  );
}
