// Process — 4-step timeline showing how the roofing process works.

"use client";

import { THEME } from "./theme";
import { motion } from "framer-motion";

const STEPS = [
  { title: "Free Inspection", desc: "We come out, climb on the roof, and check everything — decking, flashing, vents, shingles. You get an honest assessment with photos, not a sales pitch." },
  { title: "Written Estimate", desc: "You get a line-by-line breakdown: materials, labor, permits, dumpster, everything. The price we quote is the price you pay." },
  { title: "Professional Install", desc: "We protect your landscaping, tear off the old roof, inspect the deck, install new underlayment and shingles, and clean up daily. Most jobs done in 1-3 days." },
  { title: "Final Walkthrough", desc: "We walk the job with you, check every detail, do a magnetic nail sweep of your yard, and hand you your warranty paperwork. You sign off when you're happy." },
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
          From first call to final cleanup, here's what to expect.
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
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          position: "relative",
        }}
        className="grid-cols-1! sm:grid-cols-2! md:grid-cols-4!"
      >
        {STEPS.map((step, i) => (
          <motion.div key={step.title} variants={stepFade} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
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
            <h3 style={{ fontSize: 16, fontWeight: 700, color: THEME.textPrimary, marginBottom: 6, fontFamily: THEME.fontDisplay }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.6 }}>
              {step.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Nudge */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: "center", fontSize: 15, color: THEME.textMuted, marginTop: 40, lineHeight: 1.6 }}
      >
        Ready to start with step one?{" "}
        <a href="#contact" style={{ color: THEME.accent, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Get your free inspection
        </a>
      </motion.p>
    </section>
  );
}
