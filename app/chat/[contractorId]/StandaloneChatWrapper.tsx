// Standalone wrapper — renders ChatWidget in always-open, full-page mode.
// Used for iframe embeds via riley.js. Includes all features: lead form,
// estimate cards, message cap, phone validation, scoring.

"use client";

import ChatWidget from "@/components/chat-widget/ChatWidget";

interface Props {
  contractorId: string;
  businessName: string;
  customGreeting: string | null;
}

export default function StandaloneChatWrapper({ contractorId, businessName, customGreeting }: Props) {
  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <ChatWidget
        contractorId={contractorId}
        businessName={businessName}
        hasAiChatbot={true}
        accentColor="#6366f1"
        fontFamily="'Inter', -apple-system, sans-serif"
        isDarkTheme={false}
        customGreeting={customGreeting}
        isStandalone={true}
      />
      {/* AI disclosure footer */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "6px 16px 10px",
        textAlign: "center",
        fontSize: 10,
        color: "#cbd5e1",
        background: "#fff",
        zIndex: 1,
      }}>
        Riley is an AI assistant. Responses may not always be accurate.
      </div>
    </div>
  );
}
