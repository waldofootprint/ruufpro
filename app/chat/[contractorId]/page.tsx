// Standalone Riley chat page — embeddable via iframe on external sites.
// No layout chrome, no nav. Just the chat interface.
// URL: /chat/{contractorId}

import { createClient } from "@supabase/supabase-js";
import RileyStandalone from "./RileyStandalone";

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

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, has_ai_chatbot")
    .eq("id", contractorId)
    .eq("has_ai_chatbot", true)
    .single();

  if (!contractor) {
    return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Chat not available</div>;
  }

  return (
    <RileyStandalone
      contractorId={contractor.id}
      businessName={contractor.business_name}
    />
  );
}
