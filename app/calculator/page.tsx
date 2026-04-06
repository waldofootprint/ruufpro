"use client";

import { useState } from "react";
import { calculateROI, SLIDER_CONFIG } from "@/lib/roi-calculator";

// Standalone ROI calculator page — linkable from emails, ads, AEO content.
// Full experience with detailed breakdown.

export default function CalculatorPage() {
  const [missedCalls, setMissedCalls] = useState(SLIDER_CONFIG.missedCalls.default);
  const [jobValue, setJobValue] = useState(SLIDER_CONFIG.jobValue.default);
  const [closeRate, setCloseRate] = useState(SLIDER_CONFIG.closeRate.default);

  const roi = calculateROI({ missedCallsPerWeek: missedCalls, avgJobValue: jobValue, closeRate });

  return (
    <main style={{ minHeight: "100vh", background: "#0F1B2D", fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div style={{ width: "28px", height: "28px", background: "#E8722A", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff" }}>RuufPro</span>
        </a>
        <a href="/signup" style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "13px", fontWeight: 600, color: "#fff", background: "#E8722A", padding: "8px 20px", borderRadius: "99px", textDecoration: "none" }}>
          Get Started Free
        </a>
      </nav>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8722A", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>
            ROI Calculator
          </p>
          <h1 style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "12px" }}>
            How much are missed calls costing your roofing company?
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>
            Most roofers don&rsquo;t realize how much revenue walks out the door every week. Drag the sliders to see your number.
          </p>
        </div>

        {/* Calculator */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "36px" }}>
            <SliderRow label="Missed calls per week" value={missedCalls} displayValue={`${missedCalls} calls`} min={SLIDER_CONFIG.missedCalls.min} max={SLIDER_CONFIG.missedCalls.max} step={SLIDER_CONFIG.missedCalls.step} onChange={setMissedCalls} />
            <SliderRow label="Average job value" value={jobValue} displayValue={`$${jobValue.toLocaleString()}`} min={SLIDER_CONFIG.jobValue.min} max={SLIDER_CONFIG.jobValue.max} step={SLIDER_CONFIG.jobValue.step} onChange={setJobValue} />
            <SliderRow label="Close rate (when you talk to them)" value={closeRate} displayValue={`${closeRate}%`} min={SLIDER_CONFIG.closeRate.min} max={SLIDER_CONFIG.closeRate.max} step={SLIDER_CONFIG.closeRate.step} onChange={setCloseRate} />
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "28px" }} />

          {/* Big result */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>You&rsquo;re losing approximately</p>
            <p style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "clamp(3rem, 8vw, 5rem)", fontWeight: 800, color: "#E8722A", lineHeight: 1, letterSpacing: "-0.03em" }}>
              ${roi.monthlyLost.toLocaleString()}
            </p>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>every single month</p>
          </div>

          {/* Breakdown grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "8px" }}>
            <StatCard label="Per missed call" value={`$${roi.perCallValue.toLocaleString()}`} />
            <StatCard label="Per year" value={`$${roi.yearlyLost.toLocaleString()}`} />
            <StatCard label="Weeks of Pro covered" value={`${roi.weeksOfProPaidFor}+`} />
          </div>
        </div>

        {/* Explanation */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>The math</h2>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
              <span>{missedCalls} missed calls/week × 4.33 weeks</span>
              <span style={{ color: "#fff", fontWeight: 600 }}>{Math.round(missedCalls * 4.33)} calls/month</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
              <span>× ${jobValue.toLocaleString()} average job × {closeRate}% close rate</span>
              <span style={{ color: "#fff", fontWeight: 600 }}>${roi.monthlyLost.toLocaleString()}/month</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px" }}>
              <span>RuufPro Pro costs</span>
              <span style={{ color: "#059669", fontWeight: 700 }}>$149/month</span>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "16px" }}>
            Even capturing <strong style={{ color: "rgba(255,255,255,0.5)" }}>one extra call per month</strong> from your website pays for Pro {Math.round(jobValue * (closeRate / 100) / 149)}x over.
          </p>
        </div>

        {/* What RuufPro does about it */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>How RuufPro stops the bleeding</h2>
          <ul style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 2, paddingLeft: "20px", margin: 0 }}>
            <li><strong style={{ color: "#fff" }}>Free website</strong> — homeowners find you on Google instead of your competitor</li>
            <li><strong style={{ color: "#fff" }}>Click-to-call on every page</strong> — phone converts 37% vs 3-5% for forms</li>
            <li><strong style={{ color: "#fff" }}>Missed Call Text Back</strong> (Pro) — auto-texts homeowners within 3 seconds when you can&rsquo;t pick up</li>
            <li><strong style={{ color: "#fff" }}>Review Automation</strong> (Pro) — 87% won&rsquo;t hire below 4 stars. Stack reviews automatically.</li>
            <li><strong style={{ color: "#fff" }}>Online Estimates</strong> (Pro) — 78% want pricing before they call. Show it.</li>
          </ul>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 40px", background: "#E8722A", color: "#fff", borderRadius: "99px", fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "16px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(232,114,42,0.35)" }}>
            Stop Losing ${roi.monthlyLost.toLocaleString()}/Month
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "12px" }}>
            Free. No credit card. No contract. Takes 4 minutes.
          </p>
        </div>

        {/* Source */}
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "48px" }}>
          Formula based on industry averages. Source: Andy Steuer, WeLevel ($6B in exits) — using a roofer as his exact example.
        </p>
      </div>
    </main>
  );
}

function SliderRow({ label, value, displayValue, min, max, step, onChange }: {
  label: string; value: number; displayValue: string; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "15px", fontWeight: 700, color: "#fff" }}>{displayValue}</span>
      </div>
      <div style={{ position: "relative", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: "#E8722A", borderRadius: "4px", transition: "width 0.1s" }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "absolute", top: "-10px", left: 0, width: "100%", height: "28px", WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff" }}>{value}</p>
    </div>
  );
}
