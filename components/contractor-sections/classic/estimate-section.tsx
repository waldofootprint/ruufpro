"use client";

// Classic Estimate Section — clean, minimal wrapper for the estimate widget.
// Dark background section to create visual contrast.

import { CLASSIC } from "../theme-classic";
import { motion } from "framer-motion";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

interface EstimateSectionProps {
  hasEstimateWidget: boolean;
  contractorId: string;
  businessName: string;
  phone: string;
}

export default function ClassicEstimate({
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
        background: CLASSIC.bgDark,
        padding: "80px 24px",
        fontFamily: CLASSIC.fontBody,
      }}
    >
      <div style={{ maxWidth: CLASSIC.maxWidth, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: CLASSIC.textOnDarkMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 12,
              fontFamily: CLASSIC.fontDisplay,
            }}
          >
            FREE ESTIMATE
          </span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              color: CLASSIC.textOnDark,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
              marginBottom: 12,
              fontFamily: CLASSIC.fontDisplay,
            }}
          >
            Get Your Estimate in Minutes
          </h2>
          <p
            style={{
              fontSize: 15,
              color: CLASSIC.textOnDarkMuted,
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
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
