"use client";

// Hero — split layout with headline, CTAs, address input, and image.
// Falls back to smart defaults if roofer hasn't customized content.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type HeroProps = Pick<
  ContractorSiteData,
  "businessName" | "phone" | "city" | "heroHeadline" | "tagline" | "heroCta" | "heroImage" | "hasEstimateWidget"
>;

export default function Hero({
  businessName,
  phone,
  city,
  heroHeadline,
  tagline,
  heroCta,
  heroImage,
  hasEstimateWidget,
}: HeroProps) {
  const phoneClean = phone.replace(/\D/g, "");

  // Smart defaults — if the roofer hasn't set custom content
  const headline = heroHeadline || `${city}'s trusted roofing experts.`;
  const subtitle = tagline || `Quality roof replacement & repair you can count on. Locally owned, licensed, and insured.`;
  const ctaText = heroCta || "Get Your Free Estimate";
  const imgSrc = heroImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85&auto=format";

  return (
    <section
      id="hero"
      style={{
        padding: "120px 24px 80px",
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 48,
          alignItems: "center",
        }}
        className="grid-cols-1! md:grid-cols-[1.1fr_0.9fr]!"
      >
        {/* Left: text content */}
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: THEME.accent,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
              fontFamily: THEME.fontDisplay,
            }}
          >
            Locally owned in {city}
          </p>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 54px)",
              fontWeight: 800,
              color: THEME.textPrimary,
              lineHeight: 1.08,
              letterSpacing: "-0.5px",
              marginBottom: 16,
              fontFamily: THEME.fontDisplay,
            }}
          >
            {headline}
          </h1>

          <p
            style={{
              fontSize: 17,
              color: THEME.textSecondary,
              lineHeight: 1.6,
              maxWidth: 480,
              marginBottom: 32,
            }}
          >
            {subtitle}
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
            {hasEstimateWidget ? (
              <a
                href="#estimate"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: THEME.accent,
                  color: "#fff",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: THEME.fontDisplay,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = THEME.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = THEME.accent)}
              >
                {ctaText}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            ) : (
              <a
                href="#contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: THEME.accent,
                  color: "#fff",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: THEME.fontDisplay,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = THEME.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = THEME.accent)}
              >
                Contact Us
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            )}
            <a
              href={`tel:${phoneClean}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                background: "transparent",
                color: THEME.textPrimary,
                border: `1.5px solid ${THEME.border}`,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                fontFamily: THEME.fontDisplay,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = THEME.primary;
                e.currentTarget.style.background = "rgba(30,58,95,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              Call Now
            </a>
          </div>
        </div>

        {/* Right: hero image */}
        <div style={{ position: "relative" }}>
          <img
            src={imgSrc}
            alt={`${businessName} - roofing services in ${city}`}
            style={{
              width: "100%",
              height: 420,
              objectFit: "cover",
              borderRadius: THEME.borderRadiusLg,
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          />
          {/* Floating badge */}
          <div
            style={{
              position: "absolute",
              bottom: -12,
              left: -12,
              background: "#fff",
              borderRadius: 14,
              padding: "12px 18px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: THEME.textPrimary,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={THEME.star} stroke={THEME.star} strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Rated 5 stars by happy homeowners
          </div>
        </div>
      </div>
    </section>
  );
}
