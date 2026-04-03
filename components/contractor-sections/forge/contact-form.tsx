"use client";

// Forge Contact Form — dark background with blue-accented inputs.

import { useState } from "react";
import { FORGE } from "../theme-forge";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "../types";

type ContactProps = Pick<ContractorSiteData, "businessName" | "phone" | "city" | "state" | "contractorId">;

export default function ForgeContact({
  businessName,
  phone,
  city,
  state,
  contractorId,
}: ContactProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractorId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
        }),
      });
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    color: FORGE.text,
    background: FORGE.bgCard,
    border: `1px solid ${FORGE.border}`,
    borderRadius: FORGE.borderRadius,
    outline: "none",
    fontFamily: FORGE.fontBody,
    transition: "border-color 0.2s",
  };

  return (
    <section
      id="contact"
      style={{
        background: FORGE.bgAlt,
        padding: FORGE.sectionPadding,
        fontFamily: FORGE.fontBody,
      }}
    >
      <div style={{ maxWidth: FORGE.maxWidth, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ width: 36, height: 3, background: FORGE.accent, borderRadius: 2, marginBottom: 16 }} />
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              color: FORGE.text,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
              fontFamily: FORGE.fontDisplay,
            }}
          >
            Contact Us
          </h2>
        </motion.div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}
          className="grid-cols-1! md:grid-cols-[1fr_1fr]!"
        >
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <input type="text" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = FORGE.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = FORGE.border as string)} />
            <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = FORGE.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = FORGE.border as string)} />
            <input type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = FORGE.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = FORGE.border as string)} />
            <textarea placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => (e.currentTarget.style.borderColor = FORGE.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = FORGE.border as string)} />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                padding: "14px 32px",
                background: FORGE.accent,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: "none",
                borderRadius: FORGE.borderRadius,
                cursor: status === "sending" ? "wait" : "pointer",
                transition: "background 0.2s",
                fontFamily: FORGE.fontDisplay,
                alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => { if (status !== "sending") e.currentTarget.style.background = FORGE.accentHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = FORGE.accent; }}
            >
              {status === "sending" ? "Sending..." : status === "sent" ? "Message Sent!" : "Send Message"}
            </button>
            {status === "error" && <p style={{ fontSize: 13, color: "#EF4444" }}>Something went wrong. Please call us directly.</p>}
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ padding: 32, background: FORGE.bgCard, border: `1px solid ${FORGE.border}`, borderRadius: FORGE.borderRadiusLg }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: FORGE.text, marginBottom: 24, fontFamily: FORGE.fontDisplay }}>{businessName}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={FORGE.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>, label: "PHONE", value: phone, href: `tel:${phoneClean}` },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={FORGE.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: "LOCATION", value: `${city}, ${state}` },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={FORGE.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: "HOURS", value: "Mon–Sat: 7AM–7PM" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: FORGE.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                    {item.href ? (
                      <a href={item.href} style={{ fontSize: 15, color: FORGE.text, textDecoration: "none", fontWeight: 500 }}>{item.value}</a>
                    ) : (
                      <span style={{ fontSize: 15, color: FORGE.text, fontWeight: 500 }}>{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
