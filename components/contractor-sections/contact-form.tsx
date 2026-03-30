// Contact Form — left info + right form. Submits lead to Supabase.

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type ContactFormProps = Pick<ContractorSiteData, "businessName" | "phone" | "city" | "state" | "contractorId">;

export default function ContactForm({ businessName, phone, city, state, contractorId }: ContactFormProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);

    await supabase.from("leads").insert({
      contractor_id: contractorId,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      message: form.message || null,
      source: "contact_form",
      status: "new",
    });

    // Notify contractor
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractor_id: contractorId,
        lead_name: form.name,
        lead_phone: form.phone,
        lead_email: form.email,
        lead_message: form.message,
        source: "contact_form",
      }),
    }).catch(() => {});

    setSubmitting(false);
    setSubmitted(true);
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "#fff",
    border: `1px solid ${THEME.border}`,
    borderRadius: 10,
    fontSize: 15,
    fontFamily: THEME.fontBody,
    color: THEME.textPrimary,
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section
      id="contact"
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "start" }} className="grid-cols-1! md:grid-cols-[1fr_1.2fr]!">
        {/* Left: contact info */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: THEME.fontDisplay }}>
            Get in touch
          </p>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: THEME.textPrimary, lineHeight: 1.15, marginBottom: 12, fontFamily: THEME.fontDisplay }}>
            Let's talk about your roof
          </h2>
          <p style={{ fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6, marginBottom: 32 }}>
            Fill out the form and we'll get back to you within 24 hours. Or call us directly.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Phone */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fff", border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary }}>Phone</p>
                <a href={`tel:${phoneClean}`} style={{ fontSize: 14, color: THEME.textSecondary, textDecoration: "none" }}>{phone}</a>
              </div>
            </div>

            {/* Location */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fff", border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary }}>Location</p>
                <p style={{ fontSize: 14, color: THEME.textSecondary }}>{city}, {state}</p>
              </div>
            </div>

            {/* Hours */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fff", border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary }}>Hours</p>
                <p style={{ fontSize: 14, color: THEME.textSecondary }}>Mon–Sat, 7am–6pm</p>
              </div>
            </div>
          </div>

          {/* Response badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ECFDF5", borderRadius: 8, padding: "8px 14px", marginTop: 24 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>Avg. response: under 2 hours</span>
          </div>
        </div>

        {/* Right: form */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${THEME.border}`,
            borderRadius: THEME.borderRadiusLg,
            padding: 36,
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8, fontFamily: THEME.fontDisplay }}>Message sent!</h3>
              <p style={{ fontSize: 15, color: THEME.textSecondary }}>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary, display: "block", marginBottom: 6 }}>
                  Name <span style={{ color: THEME.accent }}>*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = THEME.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = THEME.border)}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary, display: "block", marginBottom: 6 }}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = THEME.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = THEME.border)}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary, display: "block", marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = THEME.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = THEME.border)}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary, display: "block", marginBottom: 6 }}>How can we help?</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your roofing project..."
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" } as React.CSSProperties}
                  onFocus={(e) => (e.currentTarget.style.borderColor = THEME.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = THEME.border)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px 28px",
                  background: THEME.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: THEME.fontDisplay,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = THEME.accentHover; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = THEME.accent)}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
              <p style={{ fontSize: 12, color: THEME.textMuted, textAlign: "center", marginTop: 12 }}>
                We respond within 24 hours. No spam, ever.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
