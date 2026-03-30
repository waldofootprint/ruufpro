"use client";

import { Shield, Clock, CheckCircle, CreditCard } from "lucide-react";
import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "isInsured" | "offersFinancing" | "warrantyYears">;

export default function BlueprintFeatures({ warrantyYears, offersFinancing }: Props) {
  const features = [
    { icon: Shield, title: "Fully Insured", desc: "$2M liability coverage on every project" },
    { icon: Clock, title: "Same-Day Quotes", desc: "Fast response, no waiting around" },
    { icon: CheckCircle, title: `${warrantyYears || 25}-Year Warranty`, desc: "We stand behind our work, period" },
    { icon: CreditCard, title: "Financing", desc: offersFinancing ? "Flexible payment options available" : "Affordable pricing for every budget" },
  ];

  return (
    <section style={{ background: BLUEPRINT.bg, fontFamily: BLUEPRINT.fontBody }}>
      <div
        style={{ maxWidth: BLUEPRINT.maxWidth, margin: "0 auto", padding: "0 32px 64px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
        className="grid-cols-2! lg:grid-cols-4!"
      >
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              background: BLUEPRINT.bgWhite,
              borderRadius: 12,
              padding: 24,
              border: `1px solid ${BLUEPRINT.border}`,
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = BLUEPRINT.accent;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(74,111,165,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BLUEPRINT.border;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: BLUEPRINT.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <f.icon size={20} color={BLUEPRINT.accent} />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: BLUEPRINT.text, marginBottom: 4 }}>{f.title}</h4>
            <p style={{ fontSize: 12, color: BLUEPRINT.textMuted, lineHeight: 1.4 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
