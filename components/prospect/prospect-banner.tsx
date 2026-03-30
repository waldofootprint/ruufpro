"use client";

import { useState, useEffect } from "react";
import { ClaimForm } from "./claim-form";

interface ProspectBannerProps {
  businessName: string;
  slug: string;
  siteId: string;
}

export function ProspectBanner({ businessName, slug, siteId }: ProspectBannerProps) {
  const [showClaim, setShowClaim] = useState(false);
  const [tracked, setTracked] = useState(false);

  // Track page view on mount
  useEffect(() => {
    if (tracked) return;
    setTracked(true);

    fetch("/api/preview-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, site_id: siteId }),
    }).catch(() => {});
  }, [slug, siteId, tracked]);

  return (
    <>
      {/* Top banner */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          color: "white",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>
          Hi <strong>{businessName}</strong> — we built this website for your business
        </p>
        <button
          onClick={() => setShowClaim(true)}
          style={{
            background: "white",
            color: "#1e3a5f",
            border: "none",
            borderRadius: "8px",
            padding: "8px 20px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Claim This Site — Free
        </button>
      </div>

      {/* Spacer so content isn't hidden behind fixed banner */}
      <div style={{ height: "52px" }} />

      {/* Floating CTA for mobile (bottom of screen) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "center",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={() => setShowClaim(true)}
          style={{
            background: "white",
            color: "#1e3a5f",
            border: "none",
            borderRadius: "8px",
            padding: "12px 32px",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          Claim This Site — It&apos;s Free
        </button>
      </div>

      {/* Claim form modal */}
      {showClaim && (
        <ClaimForm
          businessName={businessName}
          slug={slug}
          siteId={siteId}
          onClose={() => setShowClaim(false)}
        />
      )}
    </>
  );
}
