"use client";

import Image from "next/image";
import { ArrowRight, Phone, Star, CheckCircle, Home } from "lucide-react";
import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "city" | "phone" | "heroHeadline" | "tagline" | "heroCta" | "heroImage" | "hasEstimateWidget" | "yearsInBusiness">;

export default function BlueprintHero({ businessName, city, phone, heroHeadline, tagline, heroCta, heroImage, hasEstimateWidget, yearsInBusiness }: Props) {
  const phoneClean = phone.replace(/\D/g, "");
  const headline = heroHeadline || "Built Right.\nPriced Fair.";
  const sub = tagline || `Roof replacements, repairs, and inspections for ${city} homeowners. Upfront pricing, clean job sites, and work that's done right the first time.`;
  const cta = heroCta || "Get Free Estimate";
  const imgSrc = heroImage || "https://images.unsplash.com/photo-1635424710928-0544e8512eae?w=800&q=80";

  return (
    <section id="hero" style={{ background: BLUEPRINT.bg, fontFamily: BLUEPRINT.fontBody }}>
      <style>{`
        @keyframes bpFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bp-fade { animation: bpFadeIn 0.7s ease-out forwards; opacity: 0; }
        .bp-d1 { animation-delay: 0.1s; }
        .bp-d2 { animation-delay: 0.2s; }
        .bp-d3 { animation-delay: 0.3s; }
        .bp-d4 { animation-delay: 0.4s; }
        .bp-d5 { animation-delay: 0.5s; }
      `}</style>

      <div
        style={{ maxWidth: BLUEPRINT.maxWidth, margin: "0 auto", padding: "80px 32px 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}
        className="grid-cols-1! lg:grid-cols-2!"
      >
        {/* Left */}
        <div>
          <div className="bp-fade bp-d1"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: BLUEPRINT.accent, background: BLUEPRINT.accentLight, padding: "6px 12px", borderRadius: 6, marginBottom: 16 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Licensed & Insured in {city}
          </div>

          <h1 className="bp-fade bp-d2"
            style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: "clamp(36px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.1, color: BLUEPRINT.text, marginBottom: 16, whiteSpace: "pre-line" }}
          >
            {headline}
          </h1>

          <p className="bp-fade bp-d3"
            style={{ fontSize: 17, color: BLUEPRINT.textSecondary, lineHeight: 1.6, marginBottom: 28, maxWidth: 460 }}
          >
            {sub}
          </p>

          <div className="bp-fade bp-d4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            <a
              href={hasEstimateWidget ? "#estimate" : "#contact"}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: BLUEPRINT.accent, color: "#fff", borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BLUEPRINT.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BLUEPRINT.accent)}
            >
              {cta}
              <ArrowRight size={16} />
            </a>
            <a
              href={`tel:${phoneClean}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", border: `2px solid ${BLUEPRINT.border}`, color: BLUEPRINT.text, borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = BLUEPRINT.accent; e.currentTarget.style.color = BLUEPRINT.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BLUEPRINT.border; e.currentTarget.style.color = BLUEPRINT.text; }}
            >
              <Phone size={16} />
              Call {phone}
            </a>
          </div>

          <div className="bp-fade bp-d5" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: BLUEPRINT.textMuted, fontWeight: 500 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Most calls returned same day
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: BLUEPRINT.textMuted, fontWeight: 500 }}>
              <Star size={14} fill={BLUEPRINT.star} color={BLUEPRINT.star} />
              5-star rated on Google
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: BLUEPRINT.textMuted, fontWeight: 500 }}>
              <CheckCircle size={14} color={BLUEPRINT.accent} />
              Free estimates
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="bp-fade bp-d5" style={{ position: "relative" }}>
          <div style={{ position: "relative", width: "100%", height: 400, overflow: "hidden", borderRadius: 20, border: `1px solid ${BLUEPRINT.border}`, boxShadow: "0 20px 60px rgba(15,23,42,0.08)" }}>
            <Image
              src={imgSrc}
              alt={`${businessName} — roofing in ${city}`}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          {/* Floating stat card — hidden on mobile to avoid overflow */}
          <div
            className="hidden sm:flex"
            style={{
              position: "absolute", bottom: -20, left: -24,
              background: "#fff", borderRadius: 14, padding: "16px 20px",
              boxShadow: "0 8px 32px rgba(15,23,42,0.1)", border: `1px solid ${BLUEPRINT.border}`,
              alignItems: "center", gap: 12,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: BLUEPRINT.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={20} color={BLUEPRINT.accent} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: BLUEPRINT.text }}>
                {yearsInBusiness ? `${yearsInBusiness}+` : "500+"}
              </div>
              <div style={{ fontSize: 12, color: BLUEPRINT.textMuted }}>
                {yearsInBusiness ? "Years experience" : "Roofs completed"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
