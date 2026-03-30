"use client";

import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "reviews">;

export default function BlueprintReviews({ reviews }: Props) {
  if (!reviews || reviews.length === 0) return null;
  const items = reviews.slice(0, 3);

  return (
    <section id="reviews" style={{ background: BLUEPRINT.bg, padding: BLUEPRINT.sectionPadding, fontFamily: BLUEPRINT.fontBody }}>
      <div style={{ maxWidth: BLUEPRINT.maxWidth, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: BLUEPRINT.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: BLUEPRINT.fontDisplay }}>
            Reviews
          </p>
          <h2 style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: BLUEPRINT.text }}>
            What our customers say
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: 20 }} className="grid-cols-1! md:grid-cols-3!">
          {items.map((review, i) => (
            <div
              key={i}
              style={{
                background: BLUEPRINT.bgWhite,
                borderRadius: 14,
                padding: 28,
                border: `1px solid ${BLUEPRINT.border}`,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BLUEPRINT.accent;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BLUEPRINT.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Stars */}
              <div style={{ marginBottom: 12, color: BLUEPRINT.star, fontSize: 16 }}>
                {"★".repeat(review.rating || 5)}
              </div>
              {/* Quote */}
              <p style={{ fontSize: 15, color: BLUEPRINT.textSecondary, lineHeight: 1.6, marginBottom: 16, fontStyle: "italic" }}>
                "{review.text}"
              </p>
              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: BLUEPRINT.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: BLUEPRINT.accent }}>
                  {(review.name || "A")[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: BLUEPRINT.text }}>{review.name || "Homeowner"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
