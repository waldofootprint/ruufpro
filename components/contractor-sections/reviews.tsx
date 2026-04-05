"use client";

// Reviews — 3-column grid of customer testimonial cards.
// Only renders if the roofer has at least 1 review.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type ReviewsProps = Pick<ContractorSiteData, "reviews">;

export default function Reviews({ reviews }: ReviewsProps) {
  // Don't render if no reviews
  if (!reviews || reviews.length === 0) return null;

  return (
    <section
      id="reviews"
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: THEME.fontDisplay }}>
          Reviews
        </p>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: THEME.textPrimary, lineHeight: 1.15, fontFamily: THEME.fontSerif }}>
          What our customers say
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, marginTop: 8, maxWidth: 540, lineHeight: 1.6 }}>
          Don't take our word for it — hear from homeowners who trusted us with their roof.
        </p>
      </div>

      {/* Review grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {reviews.slice(0, 3).map((review, i) => {
          // Generate initials for avatar
          const name = review.name || "A";
          const initials = name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={i}
              style={{
                background: "#fff",
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.borderRadiusLg,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <svg key={s} width="18" height="18" viewBox="0 0 24 24" fill={s < review.rating ? THEME.star : "#e5e7eb"} stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p style={{ fontSize: 15, color: THEME.textPrimary, fontStyle: "italic", lineHeight: 1.7, flex: 1, marginBottom: 20 }}>
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${THEME.border}`, paddingTop: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${THEME.primary}, #3b6b99)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: THEME.fontDisplay,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary }}>{review.name || "Homeowner"}</p>
                  <p style={{ fontSize: 12, color: THEME.textMuted }}>Google Review</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
