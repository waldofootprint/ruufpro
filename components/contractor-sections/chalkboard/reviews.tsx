"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "reviews">;

export default function ChalkReviews({ reviews }: Props) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section
      id="reviews"
      style={{
        padding: CHALK.sectionPadding,
        maxWidth: CHALK.maxWidth,
        margin: "0 auto",
        fontFamily: CHALK.fontBody,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{ fontSize: 20, color: CHALK.accent, marginBottom: 8 }}>kind words</p>
        <h2 style={{ fontFamily: CHALK.fontDisplay, fontSize: 32, color: "#fff" }}>
          What folks say
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {reviews.slice(0, 3).map((review, i) => {
          const initials = review.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div
              key={i}
              style={{
                background: CHALK.bgLight,
                border: `1px solid ${CHALK.border}`,
                borderRadius: CHALK.borderRadius,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = CHALK.accent;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = CHALK.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Large quote mark */}
              <span style={{ fontFamily: CHALK.fontDisplay, fontSize: 48, color: CHALK.accent, opacity: 0.25, lineHeight: 1, marginBottom: 4 }}>
                &ldquo;
              </span>
              {/* Stars */}
              <div style={{ color: CHALK.accent, fontSize: 16, letterSpacing: 2, marginBottom: 12 }}>
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </div>
              <p style={{ fontSize: 16, color: "rgba(232,229,216,0.7)", lineHeight: 1.6, flex: 1, marginBottom: 16 }}>
                {review.text}
              </p>
              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${CHALK.border}`, paddingTop: 14 }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: CHALK.accent, color: CHALK.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: CHALK.fontDisplay, fontSize: 14,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: CHALK.text }}>{review.name}</p>
                  <p style={{ fontSize: 12, color: CHALK.textFaint }}>Google Review</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
