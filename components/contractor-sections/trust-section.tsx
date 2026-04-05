"use client";

// TrustSection — large, prominent trust signal display.
// Shows star rating, review count, badges (Licensed, Insured, Warranty).
// This is NOT a thin bar — it's a dedicated section that screams "we're legit."

import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";

interface Theme {
  bg?: string;
  bgWarm?: string;
  bgAlt?: string;
  text?: string;
  textSecondary?: string;
  accent?: string;
  star?: string;
  fontDisplay?: string;
  fontBody?: string;
  sectionPadding?: string;
  maxWidth?: string;
  borderRadius?: string;
  border?: string;
  trustGreen?: string;
}

type TrustSectionProps = Pick<
  ContractorSiteData,
  "isLicensed" | "isInsured" | "warrantyYears" | "yearsInBusiness" | "reviews" |
  "gafMasterElite" | "owensCorningPreferred" | "certainteedSelect" | "bbbAccredited" | "offersFinancing"
> & {
  theme: Theme;
  isDark?: boolean;
  variant?: "bar" | "full"; // bar = compact trust bar, full = dedicated section
};

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function TrustSection({
  theme,
  isDark = false,
  variant = "full",
  isLicensed,
  isInsured,
  warrantyYears,
  yearsInBusiness,
  reviews = [],
  gafMasterElite,
  owensCorningPreferred,
  certainteedSelect,
  bbbAccredited,
  offersFinancing,
}: TrustSectionProps) {
  const textColor = isDark ? "#FFFFFF" : (theme.text || "#1A1A2E");
  const mutedColor = isDark ? "rgba(255,255,255,0.6)" : (theme.textSecondary || "#666");
  const accentColor = theme.accent || "#E8722A";
  const starColor = theme.star || "#EAB308";
  const greenColor = theme.trustGreen || "#16A34A";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : (theme.border || "#E5E7EB");
  const bgColor = isDark ? "rgba(255,255,255,0.03)" : (theme.bgWarm || theme.bgAlt || "#F9FAFB");

  // Build trust badges
  const badges: { icon: string; label: string }[] = [];
  if (isLicensed) badges.push({ icon: "🛡️", label: "Licensed" });
  if (isInsured) badges.push({ icon: "✓", label: "Fully Insured" });
  if (warrantyYears) badges.push({ icon: "📋", label: `${warrantyYears}-Year Warranty` });
  if (offersFinancing) badges.push({ icon: "💳", label: "Financing Available" });
  if (yearsInBusiness) badges.push({ icon: "🏠", label: `${yearsInBusiness}+ Years Experience` });
  if (badges.length < 4) badges.push({ icon: "⭐", label: "Satisfaction Guaranteed" });

  // Average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  if (variant === "bar") {
    return (
      <section style={{
        padding: "16px 24px",
        fontFamily: theme.fontBody,
        background: bgColor,
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <div style={{
          maxWidth: theme.maxWidth || "1100px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          fontSize: 13,
          fontWeight: 500,
          color: mutedColor,
        }}>
          {reviews.length > 0 && (
            <span style={{ color: textColor, fontWeight: 600 }}>
              <span style={{ color: starColor }}>★</span> {avgRating} from {reviews.length} Reviews
            </span>
          )}
          {badges.slice(0, 4).map((b, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: greenColor, fontSize: 14 }}>✓</span>
              {b.label}
            </span>
          ))}
        </div>
      </section>
    );
  }

  // Full variant — dedicated section
  return (
    <section style={{
      padding: theme.sectionPadding || "64px 32px",
      background: bgColor,
      fontFamily: theme.fontBody,
    }}>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        style={{
          maxWidth: theme.maxWidth || "1100px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Star rating + review count */}
        {reviews.length > 0 && (
          <motion.div variants={fade} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{ color: starColor, fontSize: 28 }}>★</span>
              ))}
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: textColor, margin: 0 }}>
              {avgRating} Stars from {reviews.length} Reviews
            </p>
          </motion.div>
        )}

        {/* Trust badges grid */}
        <motion.div
          variants={fade}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {badges.map((badge, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 20px",
                borderRadius: theme.borderRadius || "12px",
                border: `1px solid ${borderColor}`,
                background: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                color: textColor,
              }}
            >
              <span style={{ color: greenColor, fontSize: 16, fontWeight: 700 }}>✓</span>
              {badge.label}
            </div>
          ))}
        </motion.div>

        {/* Certification logos */}
        {(gafMasterElite || owensCorningPreferred || certainteedSelect || bbbAccredited) && (
          <motion.div
            variants={fade}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 32,
              flexWrap: "wrap",
              marginTop: 32,
              alignItems: "center",
            }}
          >
            {gafMasterElite && (
              <span style={{ fontSize: 13, fontWeight: 600, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                GAF Master Elite
              </span>
            )}
            {owensCorningPreferred && (
              <span style={{ fontSize: 13, fontWeight: 600, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Owens Corning Preferred
              </span>
            )}
            {certainteedSelect && (
              <span style={{ fontSize: 13, fontWeight: 600, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                CertainTeed SELECT
              </span>
            )}
            {bbbAccredited && (
              <span style={{ fontSize: 13, fontWeight: 600, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                BBB Accredited
              </span>
            )}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
