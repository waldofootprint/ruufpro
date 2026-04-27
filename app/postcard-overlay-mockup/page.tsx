"use client";

import { useState } from "react";

type Pin = {
  id: string;
  x: number;
  y: number;
  label: string;
  value: string;
  tone: "neutral" | "warn" | "alert";
};

type Preset = {
  id: string;
  label: string;
  address: string;
  city: string;
  yearBuilt: number;
  roofAge: number;
  sqft: number;
  lastPermit: string;
  floodZone: string;
  hurricaneHistory: number;
  pins: Pin[];
};

const PRESETS: Preset[] = [
  {
    id: "bradenton",
    label: "Bradenton FL",
    address: "8734 54th Ave E",
    city: "Bradenton, FL 34211",
    yearBuilt: 2003,
    roofAge: 22,
    sqft: 2884,
    lastPermit: "2003 (original)",
    floodZone: "X (low risk)",
    hurricaneHistory: 4,
    pins: [
      { id: "age",    x: 47, y: 38, label: "Roof age",      value: "22 yrs",         tone: "alert" },
      { id: "permit", x: 62, y: 52, label: "Last permit",   value: "Original 2003",  tone: "alert" },
      { id: "size",   x: 36, y: 60, label: "Roof area",     value: "2,884 sqft",     tone: "neutral" },
      { id: "fema",   x: 58, y: 28, label: "Flood zone",    value: "X (low risk)",   tone: "neutral" },
    ],
  },
  {
    id: "sarasota",
    label: "Sarasota FL",
    address: "212 Palm Ave",
    city: "Sarasota, FL 34236",
    yearBuilt: 1998,
    roofAge: 18,
    sqft: 1840,
    lastPermit: "2008",
    floodZone: "AE (high)",
    hurricaneHistory: 6,
    pins: [
      { id: "age",    x: 50, y: 42, label: "Roof age",     value: "18 yrs",        tone: "warn" },
      { id: "permit", x: 64, y: 55, label: "Last permit",  value: "2008",          tone: "warn" },
      { id: "fema",   x: 38, y: 30, label: "Flood zone",   value: "AE (high)",     tone: "alert" },
      { id: "storm",  x: 30, y: 65, label: "Storms (5yr)", value: "6 named",       tone: "alert" },
    ],
  },
];

const TONE = {
  neutral: { dot: "bg-stone-700", ring: "ring-stone-300", card: "bg-white text-stone-900 border-stone-200" },
  warn:    { dot: "bg-amber-500", ring: "ring-amber-300", card: "bg-amber-50 text-amber-900 border-amber-200" },
  alert:   { dot: "bg-red-500",   ring: "ring-red-300",   card: "bg-red-50 text-red-900 border-red-200" },
};

export default function PostcardOverlayMockup() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [activePin, setActivePin] = useState<string | null>(null);
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  return (
    <div className="min-h-screen bg-[#f4ede1]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-orange-600 font-bold">
            Mockup · Postcard QR landing
          </div>
          <div className="flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPresetId(p.id); setActivePin(null); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  p.id === presetId
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-700 border-stone-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-stone-300/40 overflow-hidden ring-1 ring-stone-200/60">
          <div className="px-6 pt-5 pb-3 border-b border-stone-100">
            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
              Hi neighbor — about your home at
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 mt-0.5 leading-tight">
              {preset.address}
            </h1>
            <div className="text-sm text-stone-500">{preset.city}</div>
          </div>

          <div className="relative aspect-square bg-stone-100 overflow-hidden">
            <div className="absolute inset-0 sat-zoom">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/postcard/satellite?address=${encodeURIComponent(preset.address + ", " + preset.city)}&zoom=20`}
                alt={`Satellite view`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
            </div>

            {preset.pins.map((pin, i) => {
              const tone = TONE[pin.tone];
              const isActive = activePin === pin.id;
              return (
                <button
                  key={pin.id}
                  onClick={() => setActivePin(isActive ? null : pin.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    animationDelay: `${0.6 + i * 0.15}s`,
                  }}
                  data-pin
                >
                  <span className={`block w-4 h-4 rounded-full ${tone.dot} ring-4 ${tone.ring} ring-opacity-60 shadow-lg pin-pulse`} />
                  <span
                    className={`absolute left-1/2 bottom-full mb-2 -translate-x-1/2 px-3 py-2 rounded-xl border shadow-lg whitespace-nowrap ${tone.card} ${
                      isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                    } transition`}
                  >
                    <div className="text-[10px] uppercase tracking-wide opacity-70 font-medium">
                      {pin.label}
                    </div>
                    <div className="text-sm font-semibold leading-tight">{pin.value}</div>
                  </span>
                </button>
              );
            })}

            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded-md text-[10px] font-medium text-stone-700 shadow-sm">
              tap pins for details
            </div>
          </div>

          <div className="px-6 py-4 grid grid-cols-2 gap-3">
            <Stat label="Built" value={String(preset.yearBuilt)} />
            <Stat label="Roof age" value={`${preset.roofAge} yrs`} accent={preset.roofAge >= 18} />
            <Stat label="Roof area" value={`${preset.sqft.toLocaleString()} sqft`} />
            <Stat label="Last permit" value={preset.lastPermit} accent={preset.lastPermit.includes("Original")} />
            <Stat label="Flood zone" value={preset.floodZone} accent={!preset.floodZone.startsWith("X")} />
            <Stat label="Storms (5yr)" value={`${preset.hurricaneHistory} named`} accent={preset.hurricaneHistory >= 5} />
          </div>

          {(preset.roofAge >= 18 || preset.lastPermit.includes("Original")) && (
            <div className="mx-6 mb-4 p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="text-[10px] uppercase tracking-widest text-red-700 font-bold mb-1">
                ⚠ Replacement window
              </div>
              <div className="text-sm text-red-900 leading-snug">
                FL asphalt roofs typically last 15-20 yrs. Yours is{" "}
                <span className="font-semibold">{preset.roofAge}</span>. Now's a smart time to plan ahead — before a storm forces it.
              </div>
            </div>
          )}

          <div className="bg-stone-50 border-t border-stone-100 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
                R
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                  From your local roofer
                </div>
                <div className="font-semibold text-stone-900 leading-tight">
                  Riley Roofing · Bradenton FL
                </div>
                <div className="text-xs text-stone-500">4.9 ★ · 87 reviews · 12 yrs in business</div>
              </div>
            </div>
            <button className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md whitespace-nowrap">
              Free estimate →
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-stone-400">
          This is a mockup · data shown is representative · QR scans hit a route like /postcard/[token]
        </div>
      </div>

      <style jsx>{`
        .sat-zoom {
          animation: zoom-in 18s ease-out infinite alternate;
          transform-origin: 50% 50%;
        }
        @keyframes zoom-in {
          0%   { transform: scale(1.0); }
          100% { transform: scale(1.12); }
        }
        :global(.pin-pulse) {
          animation: pin-pop 0.6s ease-out backwards, pin-breathe 2.4s ease-in-out infinite;
        }
        @keyframes pin-pop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes pin-breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0.0); }
          50%      { box-shadow: 0 0 0 12px rgba(255,255,255,0.0); }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`px-3 py-2.5 rounded-xl ${accent ? "bg-red-50 ring-1 ring-red-100" : "bg-stone-50"}`}>
      <div className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">{label}</div>
      <div className={`text-sm font-semibold ${accent ? "text-red-900" : "text-stone-900"} leading-tight mt-0.5`}>
        {value}
      </div>
    </div>
  );
}
