"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PhoneOff, Shield, Handshake } from "lucide-react";
import { calculateROI, SLIDER_CONFIG } from "@/lib/roi-calculator";

// Interactive ROI calculator + trust strip.
// Roofer drags 3 sliders, sees their personal monthly loss.
// Source: Vault 032 (Andy Steuer, WeLevel).

const PROMISES = [
  { icon: PhoneOff, text: "No salesperson will ever call you." },
  { icon: Handshake, text: "No contract. Cancel anytime. Your site stays live." },
  { icon: Shield, text: "No hidden fees. No upsell tricks. No bait-and-switch." },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
} as const;

export default function RidgelineWhatsTheCatch() {
  const [missedCalls, setMissedCalls] = useState(SLIDER_CONFIG.missedCalls.default);
  const [jobValue, setJobValue] = useState(SLIDER_CONFIG.jobValue.default);
  const [closeRate, setCloseRate] = useState(SLIDER_CONFIG.closeRate.default);

  const roi = calculateROI({ missedCallsPerWeek: missedCalls, avgJobValue: jobValue, closeRate });

  return (
    <section className="relative overflow-hidden" style={{ background: "#0F1B2D" }}>
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">

        {/* Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <p style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8722A", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "20px" }}>
            The real cost
          </p>
          <h2 style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "8px" }}>
            How much are missed calls costing <span style={{ color: "#E8722A" }}>you</span>?
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.45)", maxWidth: "480px", margin: "0 auto" }}>
            Drag the sliders to match your business. Watch the number.
          </p>
        </motion.div>

        {/* Calculator card */}
        <motion.div
          style={{ maxWidth: "640px", margin: "0 auto 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", overflow: "hidden" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        >
          {/* Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginBottom: "32px" }}>
            <SliderRow
              label={SLIDER_CONFIG.missedCalls.label}
              value={missedCalls}
              displayValue={`${missedCalls} calls`}
              min={SLIDER_CONFIG.missedCalls.min}
              max={SLIDER_CONFIG.missedCalls.max}
              step={SLIDER_CONFIG.missedCalls.step}
              onChange={setMissedCalls}
            />
            <SliderRow
              label={SLIDER_CONFIG.jobValue.label}
              value={jobValue}
              displayValue={`$${jobValue.toLocaleString()}`}
              min={SLIDER_CONFIG.jobValue.min}
              max={SLIDER_CONFIG.jobValue.max}
              step={SLIDER_CONFIG.jobValue.step}
              onChange={setJobValue}
            />
            <SliderRow
              label={SLIDER_CONFIG.closeRate.label}
              value={closeRate}
              displayValue={`${closeRate}%`}
              min={SLIDER_CONFIG.closeRate.min}
              max={SLIDER_CONFIG.closeRate.max}
              step={SLIDER_CONFIG.closeRate.step}
              onChange={setCloseRate}
            />
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "24px" }} />

          {/* Result */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              You&rsquo;re losing approximately
            </p>
            <p style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 800, color: "#E8722A", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "4px" }}>
              ${roi.monthlyLost.toLocaleString()}
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
              every month in missed calls
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
              That&rsquo;s <strong style={{ color: "rgba(255,255,255,0.6)" }}>${roi.yearlyLost.toLocaleString()}/year</strong> &mdash; enough to pay for RuufPro Pro for <strong style={{ color: "rgba(255,255,255,0.6)" }}>{roi.weeksOfProPaidFor}+ weeks</strong>
            </p>
          </div>
        </motion.div>

        {/* The contrast line */}
        <motion.div
          style={{ maxWidth: "640px", margin: "0 auto 40px", textAlign: "center" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "17px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            A free RuufPro site costs <span style={{ color: "#059669", fontWeight: 700 }}>$0</span>.
            Not having one costs you <span style={{ color: "#E8722A", fontWeight: 700 }}>${roi.monthlyLost.toLocaleString()} every month</span>.
          </p>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", maxWidth: "800px", margin: "0 auto 40px" }}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {PROMISES.map((promise) => (
            <motion.div
              key={promise.text}
              variants={fadeUp}
              style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "99px", padding: "10px 20px" }}
            >
              <promise.icon style={{ width: "16px", height: "16px", color: "#E8722A", flexShrink: 0 }} strokeWidth={2.5} />
              <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
                {promise.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <a
            href="/signup"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 36px", background: "#E8722A", color: "#fff", borderRadius: "99px", fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "15px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(232,114,42,0.35)" }}
          >
            Stop Losing ${roi.monthlyLost.toLocaleString()}/Month
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
          <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "12px" }}>
            Free. No credit card. Takes 4 minutes.
          </p>
        </div>

        {/* Source */}
        <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "32px" }}>
          Formula based on industry averages. Source: Andy Steuer, WeLevel ($6B in exits).
          <a href="/calculator" style={{ color: "rgba(255,255,255,0.35)", marginLeft: "8px", textDecoration: "underline" }}>See the full calculator →</a>
        </p>
      </div>
    </section>
  );
}

/* ─── Slider Component ─── */
function SliderRow({ label, value, displayValue, min, max, step, onChange }: {
  label: string; value: number; displayValue: string; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>{displayValue}</span>
      </div>
      <div style={{ position: "relative", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: "#E8722A", borderRadius: "3px", transition: "width 0.1s" }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute", top: "-8px", left: 0, width: "100%", height: "22px",
            WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
