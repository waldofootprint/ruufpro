"use client";

// Reviews — dynamic section that adapts based on review count.
// 3+ good reviews (4-5 stars): Option C — amber left border quotes with rating badge
// <3 reviews: Option D — stats bar with trust signals, optional single quote

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type ReviewsProps = Pick<
  ContractorSiteData,
  "reviews" | "businessName" | "yearsInBusiness" | "warrantyYears" | "isLicensed" | "isInsured"
>;

export default function Reviews({ reviews, businessName, yearsInBusiness, warrantyYears, isLicensed, isInsured }: ReviewsProps) {
  // Filter to 4+ star reviews only
  const goodReviews = (reviews || []).filter((r) => r.rating >= 4);
  const hasEnoughReviews = goodReviews.length >= 3;
  const avgRating = goodReviews.length > 0
    ? (goodReviews.reduce((sum, r) => sum + r.rating, 0) / goodReviews.length).toFixed(1)
    : null;

  // Option C: 3+ good reviews — full quotes with amber borders
  if (hasEnoughReviews) {
    const displayReviews = goodReviews.slice(0, 3);

    return (
      <section
        id="reviews"
        style={{
          padding: "64px 0",
          background: THEME.bgWarm,
          borderTop: `3px solid ${THEME.accent}`,
          fontFamily: THEME.fontBody,
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: THEME.maxWidth, margin: "0 auto", padding: "0 24px" }}>
          {/* Header with rating badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 40,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <h2
              style={{
                fontFamily: THEME.fontDisplay,
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 700,
                color: THEME.textPrimary,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              What Homeowners Say
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <div
                  style={{
                    fontFamily: THEME.fontDisplay,
                    fontSize: 32,
                    fontWeight: 700,
                    color: THEME.accent,
                    lineHeight: 1,
                  }}
                >
                  {avgRating}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: THEME.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {goodReviews.length} Google Reviews
                </div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={THEME.accent} stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Quote grid with amber left borders */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
            }}
          >
            {displayReviews.map((review, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  paddingLeft: 20,
                  borderLeft: `3px solid ${THEME.accent}`,
                }}
              >
                <p
                  style={{
                    fontSize: 16,
                    color: THEME.textSecondary,
                    lineHeight: 1.65,
                    marginBottom: 16,
                  }}
                >
                  &ldquo;{review.text}&rdquo;
                </p>
                <div
                  style={{
                    fontFamily: THEME.fontDisplay,
                    fontSize: 13,
                    fontWeight: 700,
                    color: THEME.accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {review.name || "Homeowner"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Option D: <3 reviews — stats bar with trust signals + optional single quote
  // Build stats from whatever data the contractor has
  const stats: { value: string; label: string }[] = [];

  if (avgRating && goodReviews.length > 0) {
    stats.push({ value: avgRating, label: "Google Rating" });
    stats.push({ value: `${goodReviews.length}`, label: goodReviews.length === 1 ? "Review" : "Reviews" });
  }

  if (yearsInBusiness) {
    stats.push({ value: `${yearsInBusiness}+`, label: "Years" });
  }

  if (warrantyYears) {
    stats.push({ value: `${warrantyYears}yr`, label: "Warranty" });
  }

  if (isLicensed || isInsured) {
    stats.push({ value: "✓", label: "Licensed & Insured" });
  }

  // Fill to at least 3-4 stats
  if (stats.length < 3) {
    stats.push({ value: "100%", label: "Satisfaction" });
  }
  if (stats.length < 3) {
    stats.push({ value: "Free", label: "Estimates" });
  }

  // Cap at 4 stats
  const displayStats = stats.slice(0, 4);
  const bestReview = goodReviews.length > 0 ? goodReviews[0] : null;

  return (
    <section
      id="reviews"
      style={{
        background: THEME.bgWarm,
        fontFamily: THEME.fontBody,
      }}
    >
      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${displayStats.length}, 1fr)`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        {displayStats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: "40px 24px",
              textAlign: "center",
              borderRight: i < displayStats.length - 1 ? `1px solid ${THEME.border}` : "none",
            }}
          >
            <div
              style={{
                fontFamily: THEME.fontDisplay,
                fontSize: 48,
                fontWeight: 700,
                color: THEME.accent,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: THEME.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Single quote if available */}
      {bestReview && (
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < bestReview.rating ? THEME.accent : THEME.border} stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p
            style={{
              fontSize: 20,
              color: THEME.textSecondary,
              lineHeight: 1.65,
              fontStyle: "italic",
              marginBottom: 20,
            }}
          >
            &ldquo;{bestReview.text}&rdquo;
          </p>
          <div
            style={{
              fontFamily: THEME.fontDisplay,
              fontSize: 14,
              fontWeight: 700,
              color: THEME.textPrimary,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {bestReview.name || "Homeowner"}{" "}
            <span style={{ color: THEME.textMuted, fontWeight: 400, fontFamily: THEME.fontBody, textTransform: "none", letterSpacing: 0 }}>
              — Google Review
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
