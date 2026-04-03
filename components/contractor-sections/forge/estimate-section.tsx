"use client";

// Forge Estimate Section — blue background to contrast with dark sections.

import { FORGE } from "../theme-forge";
import { motion } from "framer-motion";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

interface EstimateSectionProps {
  hasEstimateWidget: boolean;
  contractorId: string;
  businessName: string;
  phone: string;
}

export default function ForgeEstimate({
  hasEstimateWidget,
  contractorId,
  businessName,
  phone,
}: EstimateSectionProps) {
  if (!hasEstimateWidget) return null;

  return (
    <section
      id="estimate"
      style={{
        background: FORGE.bgBlue,
        padding: "80px 24px",
        fontFamily: FORGE.fontBody,
      }}
    >
      <div style={{ maxWidth: FORGE.maxWidth, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <div style={{ width: 36, height: 3, background: "rgba(255,255,255,0.4)", borderRadius: 2, margin: "0 auto 16px" }} />
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
              marginBottom: 12,
              fontFamily: FORGE.fontDisplay,
            }}
          >
            Get Your Estimate in Minutes
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Enter your address below for a satellite-measured estimate. No phone call needed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ maxWidth: 560, margin: "0 auto" }}
        >
          <EstimateWidgetV4
            contractorId={contractorId}
            contractorName={businessName}
            contractorPhone={phone}
          />
        </motion.div>
      </div>
    </section>
  );
}
