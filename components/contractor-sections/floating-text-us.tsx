"use client";

type Props = {
  phone: string;
};

export default function FloatingTextUs({ phone }: Props) {
  const cleanPhone = phone.replace(/\D/g, "");

  return (
    <a
      href={`sms:${cleanPhone}`}
      style={{
        position: "fixed",
        bottom: 84,
        right: 20,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        background: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(8px)",
        color: "#fff",
        borderRadius: 50,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
      Text Us
      {/* Mobile only: hide on desktop */}
      <style>{`
        @media (min-width: 769px) {
          a[href^="sms:"][style*="position: fixed"] {
            display: none !important;
          }
        }
      `}</style>
    </a>
  );
}
