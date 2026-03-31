"use client";

import { useState } from "react";

interface ServiceAreaMapProps {
  city: string;
  state: string;
  serviceAreaCities: string[];
  accent: string;
  accentFaded: string;
  text: string;
  textMuted: string;
  textFaint: string;
  bg: string;
  border: string;
  borderDashed: string;
  fontDisplay: string;
  fontBody: string;
  activeTagBg: string;
  activeTagColor: string;
  inactiveTagBg: string;
  inactiveTagColor: string;
  inactiveTagBorder: string;
}

// Place dots on ring circumferences using percentage-based top/left.
// Container is 360x360. Center is at 50%/50%.
// Ring diameters: 120, 220, 320 → radii: 60, 110, 160px.
// As % of 360: 16.7%, 30.6%, 44.4%.
function getCityDots(count: number) {
  const ringRadiusPct = [16.7, 30.6, 44.4]; // ring radii as % of container
  const dots: { top: string; left: string; ring: number }[] = [];

  // Distribute across rings
  const perRing: number[][] = [[], [], []];
  for (let i = 0; i < count; i++) {
    perRing[i % 3].push(i);
  }

  for (let r = 0; r < 3; r++) {
    const radius = ringRadiusPct[r];
    const citiesOnRing = perRing[r].length;
    if (citiesOnRing === 0) continue;
    const offsetDeg = r * 40; // stagger rings so dots don't align
    for (let j = 0; j < citiesOnRing; j++) {
      const angleDeg = offsetDeg + (360 / citiesOnRing) * j;
      const angleRad = (angleDeg * Math.PI) / 180;
      const top = 50 - Math.cos(angleRad) * radius; // cos for Y (up = negative)
      const left = 50 + Math.sin(angleRad) * radius; // sin for X
      dots[perRing[r][j]] = {
        top: `${top.toFixed(1)}%`,
        left: `${left.toFixed(1)}%`,
        ring: r,
      };
    }
  }

  return dots;
}

export default function ServiceAreaMap({
  city,
  state,
  serviceAreaCities,
  accent,
  accentFaded,
  text,
  textMuted,
  textFaint,
  bg,
  border,
  borderDashed,
  fontDisplay,
  fontBody,
  activeTagBg,
  activeTagColor,
  inactiveTagBg,
  inactiveTagColor,
  inactiveTagBorder,
}: ServiceAreaMapProps) {
  const cities = serviceAreaCities.length > 0 ? serviceAreaCities : [city];
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const satelliteCities = cities.filter((c) => c !== city);
  const dots = getCityDots(satelliteCities.length);

  return (
    <section
      id="service-area"
      style={{
        padding: "72px 32px",
        maxWidth: 1060,
        margin: "0 auto",
        fontFamily: fontBody,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: 64,
          alignItems: "center",
        }}
        className="grid-cols-1! md:grid-cols-2!"
      >
        {/* Left: radial map */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 360, height: 360 }}>
            {/* Concentric rings */}
            {[120, 220, 320].map((size) => (
              <div
                key={size}
                style={{
                  position: "absolute",
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  border: `1.5px dashed ${borderDashed}`,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

            {/* Center pin */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -70%)",
                zIndex: 2,
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: accent }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" fill={bg} />
              </svg>
            </div>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, 8px)",
                fontSize: 14,
                fontWeight: 700,
                color: hoveredCity === city ? accent : text,
                fontFamily: fontDisplay,
                zIndex: 2,
                whiteSpace: "nowrap",
                transition: "color 0.25s ease",
              }}
            >
              {city}
            </div>

            {/* Satellite city dots — positioned on ring circumferences */}
            {satelliteCities.map((c, i) => {
              const dot = dots[i];
              if (!dot) return null;
              const isActive = hoveredCity === c;

              return (
                <div
                  key={c}
                  style={{
                    position: "absolute",
                    top: dot.top,
                    left: dot.left,
                    zIndex: 1,
                    cursor: "default",
                  }}
                  onMouseEnter={() => setHoveredCity(c)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {/* The dot — centered exactly on the ring line */}
                  <div
                    style={{
                      width: isActive ? 14 : 10,
                      height: isActive ? 14 : 10,
                      borderRadius: "50%",
                      background: isActive ? accent : text,
                      border: isActive ? `3px solid ${bg}` : `2px solid ${bg}`,
                      boxShadow: isActive
                        ? `0 2px 8px ${accentFaded}`
                        : `0 1px 4px rgba(0,0,0,0.15)`,
                      transition: "all 0.25s ease",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  {/* Label — offset from the dot */}
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: -8,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? accent : textMuted,
                      fontFamily: fontBody,
                      whiteSpace: "nowrap",
                      transition: "color 0.25s ease",
                    }}
                  >
                    {c}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: content */}
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: accent,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              fontFamily: fontDisplay,
            }}
          >
            Service Area
          </p>
          <h2
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              color: text,
              lineHeight: 1.15,
              marginBottom: 12,
              fontFamily: fontDisplay,
            }}
          >
            Serving {city} & surrounding areas
          </h2>
          <p
            style={{
              fontSize: 16,
              color: textMuted,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            We provide quality roofing services throughout the {city}, {state}{" "}
            metro area. If you're nearby, we've got you covered.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: accent, fontFamily: fontDisplay }}>
                {cities.length}
              </p>
              <p style={{ fontSize: 13, color: textFaint }}>Communities served</p>
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: accent, fontFamily: fontDisplay }}>
                30 min
              </p>
              <p style={{ fontSize: 13, color: textFaint }}>Drive radius</p>
            </div>
          </div>

          {/* City tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cities.map((c) => {
              const isPrimary = c === city;
              const isActive = hoveredCity === c;
              return (
                <span
                  key={c}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: isPrimary || isActive ? activeTagBg : inactiveTagBg,
                    color: isPrimary || isActive ? activeTagColor : inactiveTagColor,
                    border: `1px solid ${isPrimary || isActive ? activeTagBg : inactiveTagBorder}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "default",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={() => setHoveredCity(c)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill={isPrimary || isActive ? activeTagColor : accent}
                    stroke="none"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" fill={isPrimary || isActive ? activeTagBg : bg} />
                  </svg>
                  {c}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
