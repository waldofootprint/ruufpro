"use client";

// FounderSection — personal message from the business owner.
// Two-column: photo left, story + quote right.
// Humanizes the brand. "Family-owned since [year]."

import { motion } from "framer-motion";

interface Theme {
  bg?: string;
  bgWarm?: string;
  bgAlt?: string;
  text?: string;
  textSecondary?: string;
  accent?: string;
  fontDisplay?: string;
  fontBody?: string;
  sectionPadding?: string;
  maxWidth?: string;
  borderRadius?: string;
  border?: string;
}

interface FounderSectionProps {
  theme: Theme;
  isDark?: boolean;
  businessName: string;
  city: string;
  state: string;
  yearsInBusiness?: number | null;
  aboutText?: string | null;
  logoUrl?: string | null;
}

export default function FounderSection({
  theme,
  isDark = false,
  businessName,
  city,
  state,
  yearsInBusiness,
  aboutText,
  logoUrl,
}: FounderSectionProps) {
  const textColor = isDark ? "#FFFFFF" : (theme.text || "#1A1A2E");
  const mutedColor = isDark ? "rgba(255,255,255,0.65)" : (theme.textSecondary || "#666");
  const accentColor = theme.accent || "#E8722A";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : (theme.border || "#E5E7EB");
  const bgColor = isDark ? "rgba(255,255,255,0.03)" : (theme.bgWarm || theme.bgAlt || "#F9FAFB");

  const defaultAbout = `We're a locally owned roofing company proudly serving ${city} and the surrounding areas.${yearsInBusiness ? ` With ${yearsInBusiness}+ years in the business,` : ""} We've built our reputation one roof at a time — quality work, fair pricing, and homeowners who become neighbors.\n\nWhen you work with ${businessName}, you're not getting a call center or a revolving door of subcontractors. You're getting a team that lives in your community and stands behind every job.`;

  const displayText = aboutText || defaultAbout;

  return (
    <section style={{
      padding: theme.sectionPadding || "80px 32px",
      background: bgColor,
      fontFamily: theme.fontBody,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: theme.maxWidth || "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        {/* Photo / Logo placeholder */}
        <div style={{
          width: 280,
          height: 320,
          borderRadius: theme.borderRadius || "12px",
          background: isDark ? "rgba(255,255,255,0.05)" : "#E5E7EB",
          border: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${businessName} logo`}
              style={{ width: "80%", height: "auto", objectFit: "contain" }}
            />
          ) : (
            <div style={{
              textAlign: "center",
              color: mutedColor,
              fontSize: 13,
              padding: 24,
              lineHeight: 1.5,
            }}>
              <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.4 }}>🏠</div>
              Your photo here
              <br />
              <span style={{ fontSize: 11, opacity: 0.6 }}>Upload in Dashboard → Settings</span>
            </div>
          )}
        </div>

        {/* Story */}
        <div>
          <p style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: accentColor,
            marginBottom: 12,
          }}>
            About {businessName}
          </p>

          <h2 style={{
            fontFamily: theme.fontDisplay,
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 700,
            color: textColor,
            margin: "0 0 20px",
            lineHeight: 1.3,
          }}>
            {yearsInBusiness
              ? `Serving ${city} for ${yearsInBusiness}+ Years`
              : `${city}'s Trusted Roofing Experts`
            }
          </h2>

          {displayText.split("\n\n").map((paragraph, i) => (
            <p key={i} style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: mutedColor,
              margin: i > 0 ? "16px 0 0" : 0,
            }}>
              {paragraph}
            </p>
          ))}

          {/* Signature-style */}
          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${borderColor}`,
          }}>
            <p style={{
              fontSize: 14,
              fontWeight: 600,
              color: textColor,
              fontStyle: "italic",
            }}>
              "We treat every roof like it's our own home."
            </p>
            <p style={{ fontSize: 13, color: mutedColor, marginTop: 4 }}>
              — The {businessName} Team
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mobile: stack */}
      <style>{`
        @media (max-width: 768px) {
          section > div { grid-template-columns: 1fr !important; }
          section > div > div:first-child { width: 100% !important; height: 200px !important; }
        }
      `}</style>
    </section>
  );
}
