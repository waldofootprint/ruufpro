"use client";

// CertificationLogos — manufacturer certification logo row.
// GAF Master Elite, Owens Corning Preferred, CertainTeed SELECT, BBB Accredited.
// Uses text badges with brand-accurate styling since we can't ship actual logos.

import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";

interface Theme {
  bg?: string;
  bgWarm?: string;
  bgAlt?: string;
  text?: string;
  textMuted?: string;
  accent?: string;
  border?: string;
  fontBody?: string;
  sectionPadding?: string;
  maxWidth?: string;
}

type CertLogoProps = Pick<
  ContractorSiteData,
  "gafMasterElite" | "owensCorningPreferred" | "certainteedSelect" | "bbbAccredited"
> & {
  theme: Theme;
  isDark?: boolean;
};

const CERTS = [
  { key: "gafMasterElite" as const, name: "GAF Master Elite", sub: "Factory-Certified" },
  { key: "owensCorningPreferred" as const, name: "Owens Corning", sub: "Preferred Contractor" },
  { key: "certainteedSelect" as const, name: "CertainTeed", sub: "SELECT ShingleMaster" },
  { key: "bbbAccredited" as const, name: "BBB Accredited", sub: "A+ Rating" },
];

export default function CertificationLogos({
  theme,
  isDark = false,
  gafMasterElite,
  owensCorningPreferred,
  certainteedSelect,
  bbbAccredited,
}: CertLogoProps) {
  const flags: Record<string, boolean> = { gafMasterElite: !!gafMasterElite, owensCorningPreferred: !!owensCorningPreferred, certainteedSelect: !!certainteedSelect, bbbAccredited: !!bbbAccredited };
  const activeCerts = CERTS.filter((c) => flags[c.key]);

  if (activeCerts.length === 0) return null;

  const textColor = isDark ? "rgba(255,255,255,0.7)" : (theme.textMuted || "#94A3B8");
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : (theme.border || "#E5E7EB");
  const labelColor = isDark ? "rgba(255,255,255,0.45)" : (theme.textMuted || "#94A3B8");

  return (
    <section style={{
      padding: "32px 32px",
      fontFamily: theme.fontBody,
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: theme.maxWidth || "1100px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: labelColor,
          marginBottom: 20,
        }}>
          Certified By
        </p>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
          flexWrap: "wrap",
        }}>
          {activeCerts.map((cert) => (
            <div key={cert.key} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}>
              <span style={{
                fontSize: 15,
                fontWeight: 700,
                color: textColor,
                letterSpacing: "-0.01em",
              }}>
                {cert.name}
              </span>
              <span style={{
                fontSize: 11,
                color: labelColor,
                fontWeight: 500,
              }}>
                {cert.sub}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
