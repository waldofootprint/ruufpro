// Why Us — trust badges grid + stat banner.
// Dynamically shows only badges the roofer actually has.

"use client";

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type WhyUsProps = Pick<
  ContractorSiteData,
  | "city"
  | "isLicensed"
  | "isInsured"
  | "gafMasterElite"
  | "owensCorningPreferred"
  | "certainteedSelect"
  | "bbbAccredited"
  | "bbbRating"
  | "offersFinancing"
  | "warrantyYears"
  | "yearsInBusiness"
>;

interface Badge {
  title: string;
  desc: string;
  iconBg: string;
  icon: React.ReactElement;
}

export default function WhyUs(props: WhyUsProps) {
  // Build badges dynamically from contractor profile
  const badges: Badge[] = [];

  if (props.isLicensed || props.isInsured) {
    badges.push({
      title: "Licensed & Insured",
      desc: "Fully licensed contractor with comprehensive liability and workers' comp coverage.",
      iconBg: "#ECFDF5",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={THEME.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    });
  }

  if (props.gafMasterElite) {
    badges.push({
      title: "GAF Master Elite",
      desc: "Top 2% of roofing contractors nationwide. Factory-certified for the highest quality installations.",
      iconBg: "#EFF6FF",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    });
  }

  if (props.owensCorningPreferred) {
    badges.push({
      title: "Owens Corning Preferred",
      desc: "Factory-certified Owens Corning installer with exclusive warranty options.",
      iconBg: "#FFF1F2",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    });
  }

  if (props.certainteedSelect) {
    badges.push({
      title: "CertainTeed Select",
      desc: "ShingleMaster certified installer with advanced manufacturer training.",
      iconBg: "#EEF2FF",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
    });
  }

  if (props.warrantyYears) {
    badges.push({
      title: `${props.warrantyYears}-Year Warranty`,
      desc: `Every project backed by a ${props.warrantyYears}-year workmanship warranty for your peace of mind.`,
      iconBg: "#FFFBEB",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
    });
  }

  if (props.offersFinancing) {
    badges.push({
      title: "Financing Available",
      desc: "Flexible payment options to fit your budget. Get your roof done now, pay over time.",
      iconBg: "#ECFDF5",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={THEME.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    });
  }

  if (props.bbbAccredited) {
    badges.push({
      title: `BBB Accredited${props.bbbRating ? ` (${props.bbbRating})` : ""}`,
      desc: "Accredited by the Better Business Bureau with a proven track record of trust.",
      iconBg: "#EFF6FF",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>,
    });
  }

  // Always add "Locally Owned" as a baseline
  badges.push({
    title: "Locally Owned",
    desc: `Not a franchise — we live and work right here in ${props.city}. Your neighbors are our customers.`,
    iconBg: "#ECFDF5",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={THEME.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  });

  // Don't render if fewer than 2 badges
  if (badges.length < 2) return null;

  return (
    <section
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
          Why choose us
        </p>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: THEME.textPrimary, lineHeight: 1.15, fontFamily: THEME.fontDisplay }}>
          Why homeowners choose us
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, marginTop: 8, maxWidth: 540, lineHeight: 1.6 }}>
          We don't just fix roofs — we build trust with every project.
        </p>
      </div>

      {/* Badge grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {badges.slice(0, 6).map((badge) => (
          <div
            key={badge.title}
            style={{
              background: "#fff",
              border: `1.5px solid ${THEME.border}`,
              borderTop: "3px solid transparent",
              borderRadius: THEME.borderRadius,
              padding: 24,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderTopColor = THEME.accent;
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderTopColor = "transparent";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: badge.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              {badge.icon}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: THEME.textPrimary, marginBottom: 6, fontFamily: THEME.fontDisplay }}>
              {badge.title}
            </h3>
            <p style={{ fontSize: 14, color: THEME.textSecondary, lineHeight: 1.6 }}>
              {badge.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Stat banner */}
      {props.yearsInBusiness && (
        <div
          style={{
            background: THEME.primary,
            borderRadius: THEME.borderRadius,
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: THEME.fontDisplay }}>
            Trusted by {props.city} homeowners for over {props.yearsInBusiness > 1 ? `${props.yearsInBusiness} years` : "a year"}.
          </p>
        </div>
      )}
    </section>
  );
}
