"use client";

import { Calculator, Clock, ShieldCheck, Zap } from "lucide-react";
import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

type Props = Pick<ContractorSiteData, "hasEstimateWidget" | "contractorId" | "businessName" | "phone">;

const PERKS = [
  { icon: Clock, label: "Takes 2 minutes" },
  { icon: ShieldCheck, label: "No spam, ever" },
  { icon: Zap, label: "Instant results" },
];

export default function BlueprintEstimate({ hasEstimateWidget, contractorId, businessName, phone }: Props) {
  if (!hasEstimateWidget) return null;
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <section id="estimate" style={{ background: BLUEPRINT.bgAlt, padding: BLUEPRINT.sectionPadding, fontFamily: BLUEPRINT.fontBody }}>
      <div style={{ maxWidth: BLUEPRINT.maxWidth, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: BLUEPRINT.accentLight, padding: "6px 12px", borderRadius: 6, marginBottom: 16 }}>
            <Calculator size={14} color={BLUEPRINT.accent} />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: BLUEPRINT.accent }}>
              Free Instant Estimate
            </span>
          </div>
          <h2 style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: BLUEPRINT.text, marginBottom: 12 }}>
            What will your roof cost?
          </h2>
          <p style={{ fontSize: 16, color: BLUEPRINT.textSecondary, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Get a ballpark estimate in about 2 minutes. We measure your actual roof from satellite imagery and apply our pricing — no phone call, no email, no pressure.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
            {PERKS.map((p) => (
              <span key={p.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: BLUEPRINT.textMuted }}>
                <p.icon size={14} color={BLUEPRINT.accent} />
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", background: "#1B2838", borderRadius: 20, padding: 24 }}>
          <EstimateWidgetV4
            contractorId={contractorId}
            contractorName={businessName}
            contractorPhone={phone}
          />
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: BLUEPRINT.textMuted }}>
          Prefer to talk to a human?{" "}
          <a href={`tel:${phoneClean}`} style={{ color: BLUEPRINT.accent, textDecoration: "underline", textUnderlineOffset: 2 }}>
            Call {phone}
          </a>
        </p>
      </div>
    </section>
  );
}
