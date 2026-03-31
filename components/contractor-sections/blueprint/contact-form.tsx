"use client";

import { useState } from "react";
import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";
import { createClient } from "@supabase/supabase-js";

type Props = Pick<ContractorSiteData, "businessName" | "phone" | "city" | "state" | "contractorId">;

export default function BlueprintContact({ businessName, phone, city, state, contractorId }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const phoneClean = phone.replace(/\D/g, "");

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return;
    setSending(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: leadErr } = await supabase.from("leads").insert({
        contractor_id: contractorId,
        name: form.name,
        email: form.email || null,
        phone: form.phone,
        message: form.message || null,
        source: "contact_form",
      });
      if (leadErr) console.error("Lead insert failed:", leadErr);
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId, leadName: form.name, leadPhone: form.phone, leadEmail: form.email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setSending(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: BLUEPRINT.bgWhite,
    border: `1px solid ${BLUEPRINT.border}`,
    borderRadius: 10,
    fontSize: 15,
    color: BLUEPRINT.text,
    fontFamily: BLUEPRINT.fontBody,
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section id="contact" style={{ background: BLUEPRINT.bgWhite, padding: BLUEPRINT.sectionPadding, fontFamily: BLUEPRINT.fontBody }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: BLUEPRINT.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: BLUEPRINT.fontDisplay }}>
            Contact
          </p>
          <h2 style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: BLUEPRINT.text, marginBottom: 8 }}>
            Get in touch
          </h2>
          <p style={{ fontSize: 16, color: BLUEPRINT.textSecondary, lineHeight: 1.6 }}>
            Send us a message or call <a href={`tel:${phoneClean}`} style={{ color: BLUEPRINT.accent, fontWeight: 600, textDecoration: "none" }}>{phone}</a>
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: 40, background: BLUEPRINT.accentLight, borderRadius: 14 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: BLUEPRINT.text, marginBottom: 8 }}>Thank you!</p>
            <p style={{ fontSize: 15, color: BLUEPRINT.textSecondary }}>We'll be in touch shortly.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              placeholder="Your name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.border)}
            />
            <input
              placeholder="Phone number *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.border)}
            />
            <input
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.border)}
            />
            <textarea
              placeholder="E.g. 'I have a leak near my chimney' or 'I need a full replacement quote'..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BLUEPRINT.border)}
            />
            <button
              onClick={handleSubmit}
              disabled={sending || !form.name || !form.phone}
              style={{
                width: "100%",
                padding: "14px",
                background: sending ? BLUEPRINT.textMuted : BLUEPRINT.accent,
                color: "#fff",
                borderRadius: 9999,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: BLUEPRINT.fontBody,
                border: "none",
                cursor: sending ? "wait" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: BLUEPRINT.textMuted, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Most messages returned within a few hours
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
