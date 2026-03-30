// Process — 4-step timeline showing how the roofing process works.
// Mostly static content — same for all roofers.

"use client";

import { THEME } from "./theme";

const STEPS = [
  { title: "Free Inspection", desc: "We come to you, assess your roof condition, and identify any issues — completely free." },
  { title: "Detailed Estimate", desc: "You get a clear, written estimate with material options and pricing. No surprises." },
  { title: "Expert Installation", desc: "Our skilled crew handles the job efficiently, protecting your property throughout." },
  { title: "Final Walkthrough", desc: "We inspect the work with you, clean up the site, and make sure you're 100% satisfied." },
];

export default function Process() {
  return (
    <section
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: THEME.fontDisplay }}>
          Our process
        </p>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: THEME.textPrimary, lineHeight: 1.15, fontFamily: THEME.fontDisplay }}>
          How it works
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, marginTop: 8, maxWidth: 540, margin: "8px auto 0", lineHeight: 1.6 }}>
          From first call to final cleanup, here's what to expect.
        </p>
      </div>

      {/* Steps */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          position: "relative",
        }}
        className="grid-cols-1! sm:grid-cols-2! md:grid-cols-4!"
      >
        {STEPS.map((step, i) => (
          <div key={step.title} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: THEME.bgWarm,
                border: `2px solid ${THEME.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                color: THEME.primary,
                margin: "0 auto 16px",
                fontFamily: THEME.fontDisplay,
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = THEME.primary;
                e.currentTarget.style.borderColor = THEME.primary;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = THEME.bgWarm;
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.color = THEME.primary;
              }}
            >
              {i + 1}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: THEME.textPrimary, marginBottom: 6, fontFamily: THEME.fontDisplay }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 14, color: THEME.textMuted, lineHeight: 1.6 }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
