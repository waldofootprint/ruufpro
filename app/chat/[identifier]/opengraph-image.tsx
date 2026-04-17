// Auto-generated OG image for Riley standalone chat pages.
// Shows contractor business name + city/state with RuufPro branding.
// 1200x630 canvas per Open Graph spec.

import { ImageResponse } from "next/og";
import { getChatData } from "./get-chat-data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default async function OGImage({ params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params;
  const data = await getChatData(identifier);

  const businessName = data?.businessName || "Roofing Contractor";
  const location = data ? `${data.city}, ${data.state}` : "";
  const accent = data?.accentColor || "#6366f1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: accent,
          }}
        />

        {/* Chat icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            fontSize: 36,
            color: "#fff",
          }}
        >
          💬
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#f8fafc",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          Chat with {businessName}
        </div>

        {/* Location */}
        {location && (
          <div
            style={{
              fontSize: 24,
              color: "#94a3b8",
              marginTop: 16,
            }}
          >
            {location}
          </div>
        )}

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: "#64748b",
            marginTop: 24,
          }}
        >
          AI Roofing Assistant · Get Instant Answers
        </div>

        {/* Powered by */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "#475569",
          }}
        >
          Powered by RuufPro
        </div>
      </div>
    ),
    { ...size }
  );
}
