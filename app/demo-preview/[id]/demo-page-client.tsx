"use client";

import { useState } from "react";
import ChatWidget from "@/components/chat-widget/ChatWidget";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

interface ProspectData {
  id: string;
  businessName: string;
  city: string;
  state: string;
  phone: string;
  rating: number;
  reviewsCount: number;
  services: string[];
  serviceAreas: string[];
  faq: Array<{ question: string; answer: string }> | null;
  about: string | null;
  ownerName: string | null;
  contractorId: string | null;
}

export default function DemoPageClient({ prospect }: { prospect: ProspectData }) {
  const [activeSection, setActiveSection] = useState<"riley" | "estimate">("riley");
  const accentColor = "#2D6A4F";

  // Build a temporary contractor ID for the chat API
  // If the prospect already has a contractor record, use it
  // Otherwise we'll need to handle this in the chat API
  const contractorId = prospect.contractorId || prospect.id;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#FFFFFF",
        minHeight: "100vh",
        maxWidth: 390,
        margin: "0 auto",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Sticky top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(226,232,240,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: accentColor }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>RuufPro</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8", letterSpacing: "0.05em" }}>
          BUILT FOR {prospect.businessName.toUpperCase()}
        </span>
      </div>

      {/* Hero section */}
      <div style={{ padding: "40px 20px 0" }}>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            lineHeight: "40px",
            letterSpacing: "-0.03em",
            color: "#1E293B",
            margin: "0 0 14px",
          }}
        >
          This AI knows<br />your business
        </h1>
        <p style={{ fontSize: 15, lineHeight: "23px", color: "#64748B", margin: 0 }}>
          Riley already knows your services, your service area, and how to answer your
          customers&apos; questions. Try it.
        </p>
      </div>

      {/* Live Riley chatbot */}
      <div
        style={{
          margin: "28px 20px 0",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
          borderLeft: `3px solid ${accentColor}`,
          height: 480,
          position: "relative",
        }}
      >
        <ChatWidget
          contractorId={contractorId}
          businessName={prospect.businessName}
          hasAiChatbot={true}
          accentColor={accentColor}
          fontFamily="'DM Sans', sans-serif"
          isStandalone={true}
        />
      </div>

      {/* Live note */}
      <p
        style={{
          textAlign: "center",
          padding: "20px 20px 0",
          fontSize: 13,
          color: "#94A3B8",
          lineHeight: "19px",
          margin: 0,
        }}
      >
        This is live — not a recording. Riley was trained on your actual business data.
      </p>

      {/* Scroll hint */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 20px 48px",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: accentColor, letterSpacing: "0.06em" }}>
          SEE WHAT ELSE WE BUILT YOU
        </span>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path d="M1 1L8 8L15 1" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* How it works section */}
      <div style={{ padding: "64px 20px", background: "#FAFBFC" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: accentColor, marginBottom: 12 }}>
          HOW IT WORKS
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: "30px",
            letterSpacing: "-0.02em",
            color: "#1E293B",
            margin: "0 0 32px",
          }}
        >
          We did the hard part already
        </h2>

        {[
          {
            num: "1",
            title: "We found your business online",
            desc: "Your website, reviews, services, and service area — all scraped and organized automatically.",
          },
          {
            num: "2",
            title: "We trained Riley on your data",
            desc: "Riley knows what you offer, where you work, and how to talk to your customers.",
          },
          {
            num: "3",
            title: "You get leads while you work",
            desc: "Homeowners ask Riley questions, get estimates, and submit their info — sent straight to your phone.",
          },
        ].map((step) => (
          <div key={step.num} style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "flex-start" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: accentColor,
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {step.num}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: "19px" }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Estimate widget section */}
      <div style={{ padding: "64px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: accentColor, marginBottom: 12 }}>
          ESTIMATE WIDGET
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: "32px",
            letterSpacing: "-0.02em",
            color: "#1E293B",
            margin: "0 0 10px",
          }}
        >
          Your customers get instant ballpark estimates
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", lineHeight: "22px", margin: "0 0 24px" }}>
          They type an address. Your widget measures the roof and shows a price range. The lead goes straight to your phone.
        </p>

        {/* Real estimate widget */}
        <EstimateWidgetV4
          contractorId={contractorId}
          contractorName={prospect.businessName}
          contractorPhone={prospect.phone || ""}
          variant="light"
          accentColor={accentColor}
        />

        <p style={{ textAlign: "center", padding: "20px 0 0", fontSize: 13, color: "#64748B", lineHeight: "19px", margin: 0 }}>
          Every estimate = a lead with their name, phone, email, and address. Sent directly to you.
        </p>
      </div>

      {/* Dashboard section */}
      <div style={{ padding: "64px 20px", background: "#FAFBFC" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: accentColor, marginBottom: 12 }}>
          LEAD DASHBOARD
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: "32px",
            letterSpacing: "-0.02em",
            color: "#1E293B",
            margin: "0 0 10px",
          }}
        >
          Every lead. One place. AI follow-ups.
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", lineHeight: "22px", margin: "0 0 24px" }}>
          Leads come in. Riley drafts your follow-up. You tap send. No typing, no forgetting, no missed revenue.
        </p>

        {/* Dashboard mockup — this one stays as a mockup since it's showing future state */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: 16,
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Recent Leads</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>3 new today</span>
          </div>

          {[
            { name: "Maria Gonzalez", detail: "Shingle replacement · $9,200", badge: "NEW", hasDraft: true },
            { name: "James Cooper", detail: "Metal roof · $14,800", badge: "FOLLOWED UP", hasDraft: false },
            { name: "Patricia Williams", detail: "Tile repair · $3,600", badge: "NEW", hasDraft: false },
          ].map((lead) => (
            <div
              key={lead.name}
              style={{
                background: "#FAFBFC",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{lead.detail}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: lead.badge === "NEW" ? accentColor : "#F1F5F9",
                    color: lead.badge === "NEW" ? "#FFF" : "#64748B",
                  }}
                >
                  {lead.badge}
                </span>
              </div>
              {lead.hasDraft && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#F0FDF4",
                    borderRadius: 8,
                    padding: "8px 10px",
                    marginTop: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: accentColor }}>Riley&apos;s draft:</span>
                  <span style={{ fontSize: 12, color: "#374151" }}>&ldquo;Hi Maria, thanks for your interest in...&rdquo;</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features section */}
      <div style={{ padding: "64px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: accentColor, marginBottom: 12 }}>
          ALSO INCLUDED
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: "32px",
            letterSpacing: "-0.02em",
            color: "#1E293B",
            margin: "0 0 28px",
          }}
        >
          Tools that run while you&apos;re on a roof
        </h2>

        {[
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" fill={accentColor} />
              </svg>
            ),
            title: "Review Automation",
            desc: "Finished a job? We text the homeowner a review link. No awkward asking.",
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H12L17 8V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5Z" stroke={accentColor} strokeWidth="1.5" fill="none" />
                <path d="M12 3V8H17" stroke={accentColor} strokeWidth="1.5" />
                <path d="M6 12H14M6 15H11" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ),
            title: "PDF Estimate Reports",
            desc: "Branded PDF with roof measurements, material breakdown, and your pricing. Send it or print it.",
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2Z" stroke={accentColor} strokeWidth="1.5" fill="none" />
                <path d="M6 10.5L8.5 13L14 7.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            title: "Reputation Manager",
            desc: "Track your Google rating, review trends, and response rate. All in one dashboard.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "16px 0",
              borderBottom: feature.title !== "Reputation Manager" ? "1px solid #E2E8F0" : "none",
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 2 }}>{feature.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>{feature.title}</div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: "19px" }}>{feature.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA section */}
      <div style={{ padding: "72px 20px 56px", textAlign: "center", background: "#F0FDF4" }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            lineHeight: "34px",
            letterSpacing: "-0.02em",
            color: "#1E293B",
            margin: "0 0 14px",
          }}
        >
          These tools are ready.<br />They&apos;re yours.
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", lineHeight: "22px", margin: "0 0 28px" }}>
          Riley, the estimate widget, your dashboard — all configured for {prospect.businessName}. Claim them before they expire.
        </p>
        <a
          href="https://ruufpro.com/signup"
          style={{
            display: "block",
            width: "100%",
            background: accentColor,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 14,
            padding: 18,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 17,
            fontWeight: 600,
            textAlign: "center",
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(45,106,79,0.3)",
          }}
        >
          Claim Your Tools
        </a>
        <p style={{ marginTop: 14, fontSize: 13, color: "#94A3B8" }}>
          Free for 14 days · No credit card required
        </p>
      </div>
    </div>
  );
}
