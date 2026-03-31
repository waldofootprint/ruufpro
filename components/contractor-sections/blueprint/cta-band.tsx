"use client";

import { ArrowRight, Phone } from "lucide-react";
import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "phone" | "city" | "hasEstimateWidget">;

export default function BlueprintCta({ phone, city, hasEstimateWidget }: Props) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <section style={{ background: BLUEPRINT.accent, padding: "64px 32px", textAlign: "center", fontFamily: BLUEPRINT.fontBody }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h2 style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: 12, lineHeight: 1.1 }}>
          Ready to get your roof handled?
        </h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", marginBottom: 32, lineHeight: 1.6 }}>
          Free estimate, no obligation, no pressure. We'll come out, look at your roof, and give you an honest answer.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a
            href={hasEstimateWidget ? "#estimate" : "#contact"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", background: "#fff", color: BLUEPRINT.accent,
              borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Get Free Estimate
            <ArrowRight size={16} />
          </a>
          <a
            href={`tel:${phoneClean}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", border: "2px solid rgba(255,255,255,0.4)", color: "#fff",
              borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; }}
          >
            <Phone size={16} />
            Call {phone}
          </a>
        </div>
      </div>
    </section>
  );
}
