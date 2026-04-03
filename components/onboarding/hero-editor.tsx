"use client";

// Hero section editor — lets roofers customize their headline, subtitle, and CTA text.
// All fields come pre-filled with smart defaults.

interface Props {
  headline: string;
  onHeadlineChange: (v: string) => void;
  subtitle: string;
  onSubtitleChange: (v: string) => void;
  ctaText: string;
  onCtaTextChange: (v: string) => void;
}

export default function HeroEditor({
  headline, onHeadlineChange,
  subtitle, onSubtitleChange,
  ctaText, onCtaTextChange,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ display: "block" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Headline</span>
        <input
          type="text"
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value)}
          style={{
            marginTop: 4, display: "block", width: "100%", padding: "10px 14px",
            border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
            color: "#111827", outline: "none",
          }}
          placeholder="Your Roof. Done Right."
        />
        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "block" }}>
          The big text visitors see first
        </span>
      </label>

      <label style={{ display: "block" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Subtitle</span>
        <textarea
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          rows={2}
          style={{
            marginTop: 4, display: "block", width: "100%", padding: "10px 14px",
            border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
            color: "#111827", outline: "none", resize: "vertical",
          }}
          placeholder="Trusted roofing for your city..."
        />
        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "block" }}>
          A short description below the headline
        </span>
      </label>

      <label style={{ display: "block" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Button Text</span>
        <input
          type="text"
          value={ctaText}
          onChange={(e) => onCtaTextChange(e.target.value)}
          style={{
            marginTop: 4, display: "block", width: "100%", padding: "10px 14px",
            border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
            color: "#111827", outline: "none",
          }}
          placeholder="Get Your Free Estimate"
        />
        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "block" }}>
          Your main call-to-action button
        </span>
      </label>
    </div>
  );
}
