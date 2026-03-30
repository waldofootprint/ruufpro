// Chalk line divider — hand-drawn SVG line between sections.

export default function ChalkDivider() {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <svg width="100" height="4" viewBox="0 0 100 4" style={{ opacity: 0.15 }}>
        <path d="M2 2 Q25 0.5 50 2.5 T98 1.5" fill="none" stroke="#E8E5D8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
