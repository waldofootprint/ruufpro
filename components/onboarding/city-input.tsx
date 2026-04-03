"use client";

// Tag input for adding service area cities in Step 4.
// Shows each city as a "page card" with the URL it creates.

import { useState } from "react";

interface Props {
  cities: string[];
  onChange: (cities: string[]) => void;
  primaryCity: string;
  slug: string;
}

function cityToSlug(name: string): string {
  return name.toLowerCase().replace(/[.']/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function CityInput({ cities, onChange, primaryCity, slug }: Props) {
  const [input, setInput] = useState("");

  function addCity() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...cities, trimmed]);
    setInput("");
  }

  function removeCity(city: string) {
    if (city === primaryCity) return; // can't remove primary
    onChange(cities.filter((c) => c !== city));
  }

  return (
    <div>
      {/* Input row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCity(); } }}
          placeholder="Type a city name..."
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            color: "#111827",
            outline: "none",
          }}
        />
        <button
          onClick={addCity}
          style={{
            padding: "10px 20px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>

      {/* City page cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cities.map((city) => {
          const isPrimary = city === primaryCity;
          return (
            <div
              key={city}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: isPrimary ? "rgba(99,102,241,0.05)" : "#f9fafb",
                border: `1px solid ${isPrimary ? "rgba(99,102,241,0.2)" : "#e5e7eb"}`,
                borderRadius: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPrimary ? "#6366f1" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  {city}{isPrimary && <span style={{ fontSize: 11, color: "#6366f1", marginLeft: 6 }}>Main page</span>}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {slug || "your-site"}.ruufpro.com/{cityToSlug(city)}
                </div>
              </div>
              {!isPrimary && (
                <button
                  onClick={() => removeCity(city)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
        Most roofers add 3-6 nearby cities. You can add more later from your dashboard.
      </p>
    </div>
  );
}
