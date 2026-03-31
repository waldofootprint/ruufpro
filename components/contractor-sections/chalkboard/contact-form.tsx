"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "phone" | "city" | "state" | "contractorId">;

export default function ChalkContact({ businessName, phone, city, state, contractorId }: Props) {
  const phoneClean = phone.replace(/\D/g, "");
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    const { error: leadErr } = await supabase.from("leads").insert({
      contractor_id: contractorId, name: form.name,
      phone: form.phone || null, email: form.email || null,
      message: form.message || null, source: "contact_form", status: "new",
    });
    if (leadErr) console.error("Lead insert failed:", leadErr);
    fetch("/api/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractor_id: contractorId, lead_name: form.name,
        lead_phone: form.phone, lead_email: form.email,
        lead_message: form.message, source: "contact_form",
      }),
    }).catch(() => {});
    setSubmitting(false);
    setSubmitted(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", background: CHALK.bgLight,
    border: `1.5px solid ${CHALK.border}`, borderRadius: 6,
    fontSize: 17, fontFamily: CHALK.fontBody, color: CHALK.text,
    outline: "none", transition: "border-color 0.2s",
  };

  return (
    <section
      id="contact"
      style={{
        padding: CHALK.sectionPadding,
        maxWidth: 520,
        margin: "0 auto",
        fontFamily: CHALK.fontBody,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 20, color: CHALK.accent, marginBottom: 8 }}>get in touch</p>
      <h2 style={{ fontFamily: CHALK.fontDisplay, fontSize: 32, color: "#fff", marginBottom: 8 }}>
        Let's talk
      </h2>
      <p style={{ fontSize: 16, color: CHALK.textMuted, marginBottom: 8 }}>
        {city}, {state} &middot; <a href={`tel:${phoneClean}`} style={{ color: CHALK.accent, textDecoration: "none" }}>{phone}</a>
      </p>
      <p style={{ fontSize: 14, color: CHALK.textFaint, marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Most messages returned within a few hours
      </p>

      {submitted ? (
        <div style={{ padding: "40px 0" }}>
          <p style={{ fontFamily: CHALK.fontDisplay, fontSize: 24, color: CHALK.accent, marginBottom: 8 }}>Message sent!</p>
          <p style={{ fontSize: 16, color: CHALK.textMuted }}>We'll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: CHALK.text, display: "block", marginBottom: 6 }}>
              Name <span style={{ color: CHALK.accent }}>*</span>
            </label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = CHALK.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = CHALK.border)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: CHALK.text, display: "block", marginBottom: 6 }}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = CHALK.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = CHALK.border)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: CHALK.text, display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = CHALK.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = CHALK.border)} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: CHALK.text, display: "block", marginBottom: 6 }}>How can we help?</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="E.g. 'I have a leak near my chimney' or 'I need a full replacement quote'..." style={{ ...inputStyle, minHeight: 90, resize: "vertical" } as React.CSSProperties}
              onFocus={(e) => (e.currentTarget.style.borderColor = CHALK.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = CHALK.border)} />
          </div>
          <button type="submit" disabled={submitting}
            style={{
              width: "100%", padding: "14px 28px", background: CHALK.accent, color: CHALK.bg,
              border: "none", borderRadius: 9999, fontFamily: CHALK.fontDisplay, fontSize: 18,
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = CHALK.accentHover; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = CHALK.accent)}
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </section>
  );
}
