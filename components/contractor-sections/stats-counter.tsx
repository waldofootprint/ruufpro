"use client";

// StatsCounter — animated count-up numbers.
// "500+ Roofs Completed • 15 Years • 4.9 Stars"
// Numbers animate from 0 on scroll into view.

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Theme {
  text?: string;
  textSecondary?: string;
  accent?: string;
  fontDisplay?: string;
  fontBody?: string;
  sectionPadding?: string;
  maxWidth?: string;
}

interface Stat {
  value: number;
  suffix: string; // "+", " Stars", " Years", etc.
  label: string;
  prefix?: string; // "$", etc.
}

interface StatsCounterProps {
  theme: Theme;
  isDark?: boolean;
  yearsInBusiness?: number | null;
  reviews?: { rating: number }[];
  warrantyYears?: number | null;
}

function AnimatedNumber({ value, prefix = "", suffix, duration = 1.5 }: { value: number; prefix?: string; suffix: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const end = start + duration * 1000;

    function tick() {
      const now = Date.now();
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  // Format with decimal for ratings
  const formatted = suffix.includes("Star") && value < 10
    ? (display / 10).toFixed(1)
    : display.toString();

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

export default function StatsCounter({
  theme,
  isDark = false,
  yearsInBusiness,
  reviews = [],
  warrantyYears,
}: StatsCounterProps) {
  const textColor = isDark ? "#FFFFFF" : (theme.text || "#1A1A2E");
  const mutedColor = isDark ? "rgba(255,255,255,0.55)" : (theme.textSecondary || "#666");
  const accentColor = theme.accent || "#E8722A";

  // Build stats from contractor data
  const stats: Stat[] = [];

  if (yearsInBusiness) {
    stats.push({ value: yearsInBusiness, suffix: "+", label: "Years in Business" });
  }

  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    stats.push({ value: Math.round(avg * 10), suffix: " Stars", label: `${reviews.length} Reviews` });
  }

  if (warrantyYears) {
    stats.push({ value: warrantyYears, suffix: "-Year", label: "Warranty" });
  }

  // Always show a projects stat (estimated from years)
  stats.unshift({
    value: yearsInBusiness ? yearsInBusiness * 40 : 500,
    suffix: "+",
    label: "Roofs Completed",
  });

  if (stats.length < 3) {
    stats.push({ value: 100, suffix: "%", label: "Satisfaction Rate" });
  }

  return (
    <section style={{
      padding: "56px 32px",
      fontFamily: theme.fontBody,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: theme.maxWidth || "1100px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          gap: 56,
          flexWrap: "wrap",
        }}
      >
        {stats.slice(0, 4).map((stat, i) => (
          <div key={i} style={{ textAlign: "center", minWidth: 120 }}>
            <div style={{
              fontFamily: theme.fontDisplay,
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 800,
              color: accentColor,
              lineHeight: 1,
              marginBottom: 8,
            }}>
              <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 500,
              color: mutedColor,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
