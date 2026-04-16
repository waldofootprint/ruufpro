"use client";

// AboutTrust — combined About Us + Trust Badges + Financing section.
// Merges the old About, WhyUs, and FinancingCallout into one cohesive section.
// Two badge types: certification (only if true) + universal values (any roofer can use).
// Minimum 3 badges always displayed.

import { THEME } from "./theme";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";

type AboutTrustProps = Pick<
  ContractorSiteData,
  | "businessName"
  | "city"
  | "aboutText"
  | "yearsInBusiness"
  | "isLicensed"
  | "isInsured"
  | "gafMasterElite"
  | "owensCorningPreferred"
  | "certainteedSelect"
  | "bbbAccredited"
  | "bbbRating"
  | "offersFinancing"
  | "warrantyYears"
  | "phone"
> & {
  licenseNumber?: string;
};

interface Badge {
  title: string;
  desc: string;
  iconBg: string;
  icon: React.ReactElement;
}

// --- Certification badges (only shown if contractor has them) ---

function buildCertBadges(props: AboutTrustProps): Badge[] {
  const badges: Badge[] = [];

  if (props.isLicensed || props.isInsured) {
    badges.push({
      title: props.licenseNumber ? `Licensed (#${props.licenseNumber}) & Insured` : "Licensed & Insured",
      desc: "Active contractor license, general liability, and workers' comp on every crew member.",
      iconBg: THEME.primary,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    });
  }

  if (props.gafMasterElite) {
    badges.push({
      title: "GAF Master Elite",
      desc: "Top 2% of roofing contractors nationwide. Factory-certified for the highest quality installations.",
      iconBg: THEME.primary,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    });
  }

  if (props.owensCorningPreferred) {
    badges.push({
      title: "Owens Corning Preferred",
      desc: "Factory-certified Owens Corning installer with exclusive warranty options.",
      iconBg: THEME.primary,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    });
  }

  if (props.certainteedSelect) {
    badges.push({
      title: "CertainTeed Select",
      desc: "ShingleMaster certified installer with advanced manufacturer training.",
      iconBg: THEME.primary,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
    });
  }

  if (props.warrantyYears) {
    badges.push({
      title: `${props.warrantyYears}-Year Warranty`,
      desc: `Every project backed by a ${props.warrantyYears}-year workmanship warranty.`,
      iconBg: THEME.primary,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
    });
  }

  if (props.offersFinancing) {
    badges.push({
      title: "Financing Available",
      desc: "$0 down options so you can protect your home now and pay over time.",
      iconBg: THEME.primary,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    });
  }

  if (props.bbbAccredited) {
    badges.push({
      title: `BBB Accredited${props.bbbRating ? ` (${props.bbbRating})` : ""}`,
      desc: "Accredited by the Better Business Bureau with a proven track record.",
      iconBg: THEME.primary,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>,
    });
  }

  return badges;
}

// --- Universal value badges (any roofer can select) ---

const UNIVERSAL_BADGES: Badge[] = [
  {
    title: "Unmatched Workmanship",
    desc: "Every detail matters. We don't cut corners — period.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  },
  {
    title: "Superior Materials",
    desc: "We use top-tier shingles and underlayment from trusted manufacturers.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  },
  {
    title: "Transparent Pricing",
    desc: "Line-by-line estimates. No hidden fees, no surprise charges.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  },
  {
    title: "Experienced Roofers",
    desc: "Our crews have thousands of installs under their belts.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    title: "We Clean Up Daily",
    desc: "Tarps, magnetic nail sweep, and full debris haul — every single day.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  },
  {
    title: "Satisfaction Guaranteed",
    desc: "We're not done until you're happy. Final walkthrough on every job.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  },
  {
    title: "Family-Owned & Local",
    desc: "Not a franchise. We live here, work here, and answer our own phone.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
  {
    title: "Free Inspections",
    desc: "We'll assess your roof and give you an honest answer — no charge, no obligation.",
    iconBg: THEME.primary,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardFade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function AboutTrust(props: AboutTrustProps) {
  // Build badge list: certifications first, then fill with universal badges to hit minimum 3
  const certBadges = buildCertBadges(props);

  // Default universal badges for roofers who haven't selected any yet
  const defaultUniversals = ["Transparent Pricing", "Family-Owned & Local", "Satisfaction Guaranteed", "Free Inspections"];
  const universalBadges = UNIVERSAL_BADGES.filter((b) => defaultUniversals.includes(b.title));

  // Combine: cert badges first, then fill with universals until we have at least 3
  const allBadges = [...certBadges];
  for (const ub of universalBadges) {
    if (allBadges.length >= 6) break;
    if (!allBadges.some((b) => b.title === ub.title)) {
      allBadges.push(ub);
    }
  }
  // Ensure minimum 3
  if (allBadges.length < 3) {
    for (const ub of UNIVERSAL_BADGES) {
      if (allBadges.length >= 3) break;
      if (!allBadges.some((b) => b.title === ub.title)) {
        allBadges.push(ub);
      }
    }
  }

  const displayBadges = allBadges.slice(0, 6);

  return (
    <section
      id="about"
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >

      {/* --- Trust badge grid --- */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          marginBottom: props.offersFinancing ? 32 : 0,
        }}
      >
        {displayBadges.map((badge) => (
          <motion.div
            key={badge.title}
            variants={cardFade}
            style={{
              background: "#fff",
              border: `1px solid ${THEME.border}`,
              borderRadius: 0,
              padding: "20px 18px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              transition: "box-shadow 0.25s ease, border-color 0.25s ease",
            }}
            className="service-card"
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 0,
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
              <h4 style={{ fontSize: 15, fontWeight: 700, color: THEME.textPrimary, marginBottom: 3, fontFamily: THEME.fontDisplay }}>
                {badge.title}
              </h4>
              <p style={{ fontSize: 13, color: THEME.textSecondary, lineHeight: 1.6 }}>
                {badge.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

    </section>
  );
}
