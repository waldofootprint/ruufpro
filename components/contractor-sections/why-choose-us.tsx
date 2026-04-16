"use client";

// WhyChooseUs — split layout: dark headline left, light cards right.
// D5 style: dark/cream two-tone, amber left-bordered cards.
// Simple proof points built from contractor data.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type WhyChooseUsProps = Pick<
  ContractorSiteData,
  "businessName" | "yearsInBusiness" | "warrantyYears" | "isLicensed" | "isInsured" | "hasEstimateWidget" | "phone"
>;

function buildReasons(props: WhyChooseUsProps) {
  const reasons: { title: string; desc: string }[] = [];

  if (props.yearsInBusiness) {
    reasons.push({
      title: `${props.yearsInBusiness}+ Years`,
      desc: "We've seen every kind of roof problem and know how to fix it right the first time.",
    });
  } else {
    reasons.push({
      title: "Built on Experience",
      desc: "Our crews have thousands of installs under their belts. Every roof gets our full attention.",
    });
  }

  reasons.push({
    title: "Honest Pricing",
    desc: "Line-by-line estimates. No hidden fees, no surprise charges, no pressure.",
  });

  if (props.isLicensed || props.isInsured) {
    reasons.push({
      title: "Licensed & Insured",
      desc: "Active license, general liability, and workers' comp on every crew member.",
    });
  } else {
    reasons.push({
      title: "Fully Accountable",
      desc: "We stand behind every job. If something's not right, we come back and fix it.",
    });
  }

  if (props.warrantyYears) {
    reasons.push({
      title: `${props.warrantyYears}-Year Warranty`,
      desc: `Every project backed by our warranty. We don't disappear after the install.`,
    });
  } else {
    reasons.push({
      title: "We Don't Disappear",
      desc: "We're local, we're here to stay, and we answer our phone. Try that with a storm chaser.",
    });
  }

  return reasons;
}

export default function WhyChooseUs(props: WhyChooseUsProps) {
  const reasons = buildReasons(props);

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "0.9fr 1.1fr",
        minHeight: 480,
        fontFamily: THEME.fontBody,
      }}
      className="wcu-section"
    >
      {/* Left — dark headline + CTA */}
      <div
        style={{
          background: THEME.primary,
          padding: "64px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 32, height: 2, background: THEME.accent }} />
            <span
              style={{
                fontFamily: THEME.fontBody,
                fontSize: 14,
                fontWeight: 600,
                color: THEME.accent,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              Why {props.businessName}
            </span>
          </div>

          <h2
            style={{
              fontFamily: THEME.fontDisplay,
              fontSize: "clamp(36px, 4vw, 52px)",
              fontWeight: 700,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1.0,
              marginBottom: 16,
            }}
          >
            Built Different.<br />Built to Last.
          </h2>

          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.65,
              marginBottom: 32,
              maxWidth: 380,
            }}
          >
            We're not the cheapest. We're the crew you call when you want it done right — on time, on budget, no excuses.
          </p>

          <a
            href={props.hasEstimateWidget ? "#estimate-section" : "#contact"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              background: THEME.accent,
              color: THEME.primary,
              fontFamily: THEME.fontDisplay,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Get Free Estimate →
          </a>
        </div>
      </div>

      {/* Right — warm cream bg with amber-bordered cards */}
      <div
        style={{
          background: THEME.bgWarm,
          padding: "40px 36px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignContent: "center",
        }}
      >
        {reasons.map((reason) => (
          <div
            key={reason.title}
            style={{
              background: "#fff",
              border: `1px solid ${THEME.border}`,
              borderLeft: `3px solid ${THEME.accent}`,
              padding: "24px 20px",
            }}
          >
            <h3
              style={{
                fontFamily: THEME.fontDisplay,
                fontSize: 17,
                fontWeight: 700,
                color: THEME.textPrimary,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              {reason.title}
            </h3>
            <p style={{ fontSize: 14, color: THEME.textMuted, lineHeight: 1.6 }}>
              {reason.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          .wcu-section {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
