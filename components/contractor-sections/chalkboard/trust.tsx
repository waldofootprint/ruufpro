"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "isLicensed" | "isInsured" | "offersFinancing" | "warrantyYears" | "yearsInBusiness" | "gafMasterElite" | "bbbAccredited">;

export default function ChalkTrust(props: Props) {
  const badges: string[] = [];
  if (props.isLicensed || props.isInsured) badges.push("Licensed & Insured");
  if (props.gafMasterElite) badges.push("GAF Master Elite");
  if (props.bbbAccredited) badges.push("BBB Accredited");
  if (props.warrantyYears) badges.push(`${props.warrantyYears}-Year Warranty`);
  if (props.offersFinancing) badges.push("Financing Available");
  badges.push("Locally Owned");

  if (badges.length < 2) return null;

  return (
    <section
      style={{
        padding: "40px 32px",
        maxWidth: CHALK.maxWidth,
        margin: "0 auto",
        fontFamily: CHALK.fontBody,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
        {badges.slice(0, 6).map((badge) => (
          <span
            key={badge}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: CHALK.bgLight,
              border: `1px solid ${CHALK.border}`,
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 500,
              color: CHALK.text,
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = CHALK.accent; e.currentTarget.style.background = CHALK.accentSubtle; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = CHALK.border; e.currentTarget.style.background = CHALK.bgLight; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
