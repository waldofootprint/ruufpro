// Riley standalone chat page — branded, shareable via slug or UUID.
// URL: /chat/joes-roofing (slug) or /chat/{uuid} (backward compat for riley.js)

import { Metadata } from "next";
import { getChatData } from "./get-chat-data";
import StandaloneChatWrapper from "./StandaloneChatWrapper";

interface Props {
  params: Promise<{ identifier: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { identifier } = await params;
  const data = await getChatData(identifier);

  if (!data) {
    return { title: "Chat Unavailable", robots: { index: false, follow: false } };
  }

  const title = `Chat with ${data.businessName} | AI Roofing Assistant`;
  const description = `Get instant roofing answers from ${data.businessName} in ${data.city}, ${data.state}`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function ChatPage({ params }: Props) {
  const { identifier } = await params;
  const data = await getChatData(identifier);

  if (!data) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "'Inter', -apple-system, sans-serif",
        background: "#f8fafc",
      }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#334155" }}>
            Chat is currently unavailable
          </p>
          <p style={{ fontSize: 14 }}>
            Please contact the business directly for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StandaloneChatWrapper
      contractorId={data.contractorId}
      businessName={data.businessName}
      phone={data.phone}
      logoUrl={data.logoUrl}
      city={data.city}
      state={data.state}
      accentColor={data.accentColor}
      customGreeting={data.customGreeting}
      identifier={identifier}
    />
  );
}
