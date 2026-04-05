"use client";

// ProcessSteps — themed 3-step horizontal timeline.
// "1. Free Inspection → 2. Transparent Quote → 3. Expert Installation"
// Horizontal on desktop, vertical on mobile. Connected by line.

import { motion } from "framer-motion";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface Theme {
  bg?: string;
  text?: string;
  textSecondary?: string;
  accent?: string;
  fontDisplay?: string;
  fontBody?: string;
  sectionPadding?: string;
  maxWidth?: string;
  borderRadius?: string;
}

const DEFAULT_STEPS: Step[] = [
  { number: 1, title: "Free Inspection", description: "We climb on the roof, check everything, and give you an honest assessment with photos — not a sales pitch." },
  { number: 2, title: "Transparent Quote", description: "You get a line-by-line breakdown: materials, labor, permits, cleanup. The price we quote is the price you pay." },
  { number: 3, title: "Expert Installation", description: "We protect your property, install your new roof, clean up daily, and walk the final job with you. Most projects done in 1-3 days." },
];

interface ProcessStepsProps {
  theme: Theme;
  steps?: Step[];
  heading?: string;
  isDark?: boolean;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function ProcessSteps({ theme, steps = DEFAULT_STEPS, heading = "How It Works", isDark = false }: ProcessStepsProps) {
  const textColor = isDark ? "#FFFFFF" : (theme.text || "#1A1A2E");
  const mutedColor = isDark ? "rgba(255,255,255,0.65)" : (theme.textSecondary || "#666");
  const accentColor = theme.accent || "#E8722A";

  return (
    <section
      style={{
        padding: theme.sectionPadding || "80px 32px",
        fontFamily: theme.fontBody,
      }}
    >
      <div style={{ maxWidth: theme.maxWidth || "1100px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <h2 style={{
            fontFamily: theme.fontDisplay,
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: textColor,
            margin: 0,
          }}>
            {heading}
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
            gap: 32,
            position: "relative",
          }}
        >
          {/* Connecting line (desktop only) */}
          <div style={{
            position: "absolute",
            top: 28,
            left: "calc(16.67% + 28px)",
            right: "calc(16.67% + 28px)",
            height: 2,
            background: isDark ? "rgba(255,255,255,0.1)" : (theme.accent ? `${theme.accent}22` : "rgba(0,0,0,0.08)"),
            zIndex: 0,
          }} />

          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fade}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Number circle */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: accentColor,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                fontFamily: theme.fontDisplay,
                marginBottom: 20,
                flexShrink: 0,
              }}>
                {step.number}
              </div>

              {/* Title */}
              <h3 style={{
                fontFamily: theme.fontDisplay,
                fontSize: 18,
                fontWeight: 700,
                color: textColor,
                margin: "0 0 8px",
              }}>
                {step.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: mutedColor,
                margin: 0,
                maxWidth: 280,
              }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mobile override: stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          section > div > div:last-child {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          section > div > div:last-child > div:first-of-type {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
