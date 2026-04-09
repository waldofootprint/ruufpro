// Process — 4-step timeline showing how the roofing process works.

"use client";

import { THEME } from "./theme";
import { motion } from "framer-motion";

const STEPS = [
  { title: "Schedule Your Inspection", desc: "Book your free inspection online or by phone. We work around your schedule." },
  { title: "Review Your Estimate", desc: "Get a clear, honest assessment with line-by-line pricing. No surprises." },
  { title: "We Handle the Rest", desc: "We handle permits, materials, installation, and cleanup. You just pick your shingles." },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const stepFade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
};

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 48, textAlign: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, justifyContent: "center" }}>
          <div style={{ width: 3, height: 20, background: THEME.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: THEME.fontDisplay }}>
            Our process
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: THEME.textPrimary, lineHeight: 1.1, letterSpacing: "-0.02em", fontFamily: THEME.fontSerif, marginBottom: 10 }}>
          How it works
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
          From first call to final walkthrough.
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          position: "relative",
        }}
        className="grid-cols-1! sm:grid-cols-3!"
      >
        {STEPS.map((step, i) => (
          <motion.div key={step.title} variants={stepFade} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 0,
                background: THEME.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                margin: "0 auto 16px",
                fontFamily: THEME.fontDisplay,
              }}
            >
              {i + 1}
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8, fontFamily: THEME.fontDisplay, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 15, color: THEME.textMuted, lineHeight: 1.65 }}>
              {step.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Micro-CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: "center", marginTop: 48 }}
      >
        <a
          href="#contact"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: THEME.accent,
            fontWeight: 600,
            fontSize: 15,
            fontFamily: THEME.fontDisplay,
            textDecoration: "none",
          }}
        >
          Schedule my free inspection <span aria-hidden="true">→</span>
        </a>
      </motion.div>
    </section>
  );
}
