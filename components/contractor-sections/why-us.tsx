// Why Us — trust badges grid + stat banner.
// Dynamically shows only badges the roofer actually has.

"use client";

import { THEME } from "./theme";
import { motion } from "framer-motion";
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

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardFade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function WhyUs(props: WhyUsProps) {
  const badges: Badge[] = [];

  if (props.isLicensed || props.isInsured) {
    badges.push({
      title: "Licensed & Insured",
      desc: "Active contractor license, general liability insurance, and workers' comp on every crew member. We'll show you proof before we start.",
      iconBg: "#ECFDF5",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    });
  }

  if (props.gafMasterElite) {
    badges.push({
      title: "GAF Master Elite",
      desc: "Top 2% of roofing contractors nationwide. Factory-certified for the highest quality installations.",
      iconBg: "#EFF6FF",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    });
  }

  if (props.owensCorningPreferred) {
    badges.push({
      title: "Owens Corning Preferred",
      desc: "Factory-certified Owens Corning installer with exclusive warranty options.",
      iconBg: "#FFF1F2",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    });
  }

  if (props.certainteedSelect) {
    badges.push({
      title: "CertainTeed Select",
      desc: "ShingleMaster certified installer with advanced manufacturer training.",
      iconBg: "#EEF2FF",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
    });
  }

  if (props.warrantyYears) {
    badges.push({
      title: `${props.warrantyYears}-Year Warranty`,
      desc: `Every project backed by a ${props.warrantyYears}-year workmanship warranty for your peace of mind.`,
      iconBg: "#FFFBEB",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
    });
  }

  if (props.offersFinancing) {
    badges.push({
      title: "Financing Available",
      desc: "Monthly payment options so you can get your roof done now without paying everything upfront.",
      iconBg: "#ECFDF5",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    });
  }

  if (props.bbbAccredited) {
    badges.push({
      title: `BBB Accredited${props.bbbRating ? ` (${props.bbbRating})` : ""}`,
      desc: "Accredited by the Better Business Bureau with a proven track record of trust.",
      iconBg: "#EFF6FF",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>,
    });
  }

  badges.push({
    title: "Locally Owned",
    desc: `Not a franchise, not a national chain. We live and work right here in ${props.city}. When you call, you get us — not a call center.`,
    iconBg: "#ECFDF5",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  });

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 3, height: 20, background: THEME.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: THEME.fontDisplay }}>
            Why choose us
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: THEME.textPrimary, lineHeight: 1.1, letterSpacing: "-0.02em", fontFamily: THEME.fontSerif, marginBottom: 10 }}>
          Why homeowners choose us
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, maxWidth: 520, lineHeight: 1.65 }}>
          Real credentials, real coverage, real accountability. Here's what backs up our work.
        </p>
      </motion.div>

      {/* Badge grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {badges.slice(0, 6).map((badge) => (
          <motion.div
            key={badge.title}
            variants={cardFade}
            style={{
              background: "#fff",
              border: `1px solid ${THEME.border}`,
              borderRadius: 14,
              padding: "22px 20px",
              transition: "all 0.25s ease",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(30,58,95,0.2)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.05)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = THEME.border;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: badge.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {badge.icon}
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: THEME.textPrimary, marginBottom: 4, fontFamily: THEME.fontDisplay }}>
                {badge.title}
              </h3>
              <p style={{ fontSize: 13, color: THEME.textSecondary, lineHeight: 1.6 }}>
                {badge.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Stat banner */}
      {props.yearsInBusiness && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            background: THEME.primary,
            borderRadius: 14,
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: THEME.fontDisplay, textAlign: "center" }}>
            Trusted by {props.city} homeowners for over {props.yearsInBusiness > 1 ? `${props.yearsInBusiness} years` : "a year"}.
          </p>
        </motion.div>
      )}
    </section>
  );
}
