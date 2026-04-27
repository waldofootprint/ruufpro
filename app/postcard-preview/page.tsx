"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { RoofScene } from "@/lib/roof-3d-stub-data";
import { buildRoofSceneFromTrace, type RoofTrace } from "@/lib/roof-3d-from-trace";
import { buildRoofSceneFromFootprint, type Vec2 } from "@/lib/roof-3d-from-footprint";

const RoofRender3D = dynamic(
  () => import("@/components/widget/roof-render-3d").then((m) => m.RoofRender3D),
  { ssr: false }
);

type Preset = {
  id: string;
  label: string;
  address: string;
  fallbackFootprint: Vec2[];
  fallbackRoofType: "hip" | "gable";
  fallbackPitchRise: number;
  yearBuilt: number;
  estimatedRoofAge: number;
};

const PRESETS: Preset[] = [
  {
    id: "bradenton-real",
    label: "Bradenton FL · Hannah's home",
    address: "8734 54th Ave E, Bradenton, FL",
    fallbackFootprint: [
      [-25, -17.5],
      [25, -17.5],
      [25, 17.5],
      [-25, 17.5],
    ],
    fallbackRoofType: "hip",
    fallbackPitchRise: 5,
    yearBuilt: 2003,
    estimatedRoofAge: 22,
  },
  {
    id: "sarasota-narrow",
    label: "Sarasota FL · narrow gable",
    address: "212 Palm Ave, Sarasota, FL",
    fallbackFootprint: [
      [-30, -12],
      [30, -12],
      [30, 12],
      [-30, 12],
    ],
    fallbackRoofType: "gable",
    fallbackPitchRise: 6,
    yearBuilt: 1998,
    estimatedRoofAge: 18,
  },
  {
    id: "palmetto-lshape",
    label: "Palmetto FL · L-shape hip",
    address: "4501 12th St W, Palmetto, FL",
    fallbackFootprint: [
      [-22, -22],
      [22, -22],
      [22, 8],
      [0, 8],
      [0, 22],
      [-22, 22],
    ],
    fallbackRoofType: "hip",
    fallbackPitchRise: 5,
    yearBuilt: 2007,
    estimatedRoofAge: 18,
  },
];

export default function PostcardPreviewPage() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [trace, setTrace] = useState<RoofTrace | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceUsage, setTraceUsage] = useState<{ input: number; output: number } | null>(null);
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  useEffect(() => {
    setTrace(null);
    setTraceError(null);
    setTraceUsage(null);
  }, [presetId]);

  async function fetchTrace() {
    setTraceLoading(true);
    setTraceError(null);
    try {
      const resp = await fetch(
        `/api/postcard/roof-trace?address=${encodeURIComponent(preset.address)}`
      );
      const data = await resp.json();
      if (!resp.ok || !data.trace) {
        throw new Error(data.error || "trace failed");
      }
      setTrace(data.trace);
      if (data.usage) {
        setTraceUsage({ input: data.usage.input_tokens, output: data.usage.output_tokens });
      }
    } catch (err: any) {
      setTraceError(err?.message ?? "unknown error");
    } finally {
      setTraceLoading(false);
    }
  }

  const scene: RoofScene = useMemo(() => {
    if (trace) {
      try {
        return buildRoofSceneFromTrace(trace, preset.address);
      } catch (err) {
        console.error("trace conversion failed", err);
      }
    }
    return buildRoofSceneFromFootprint({
      address: preset.address,
      footprintFt: preset.fallbackFootprint,
      roofType: preset.fallbackRoofType,
      pitchRise: preset.fallbackPitchRise,
    });
  }, [preset, trace]);

  const traceCost = traceUsage
    ? (traceUsage.input * 3 + traceUsage.output * 15) / 1_000_000
    : null;

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-orange-600 font-medium mb-2">
            Preview · Postcard QR landing
          </div>
          <h1 className="text-3xl font-semibold text-stone-900">Your home, in 3D</h1>
          <p className="text-stone-600 mt-2 text-sm max-w-xl">
            Built from a satellite trace by Claude Sonnet 4.5. Drag to rotate, scroll to zoom.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPresetId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                p.id === presetId
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-500 mb-1">Property</div>
            <div className="text-xl font-semibold text-stone-900">{preset.address}</div>
            <div className="text-sm text-stone-600 mt-1">
              Built {preset.yearBuilt} · est. roof age {preset.estimatedRoofAge} yrs
              {trace && (
                <>
                  {" "}· <span className="text-emerald-700 font-medium">vision-traced</span> ·{" "}
                  {trace.roof_type} · {trace.pitch_estimate} pitch · {trace.planes.length} planes
                </>
              )}
            </div>
          </div>
          <button
            onClick={fetchTrace}
            disabled={traceLoading}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 whitespace-nowrap"
          >
            {traceLoading ? "Tracing… (~15s)" : trace ? "Re-trace" : "Trace with Vision"}
          </button>
        </div>

        {traceError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
            Trace failed: {traceError}
          </div>
        )}

        {traceCost !== null && (
          <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg">
            Trace cost: ${traceCost.toFixed(4)} ({traceUsage!.input.toLocaleString()} in /{" "}
            {traceUsage!.output.toLocaleString()} out tokens)
            {trace?.notes && <> · "{trace.notes}"</>}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">
              Google satellite (zoom 20)
            </div>
            <div className="rounded-2xl overflow-hidden ring-1 ring-stone-200 bg-stone-100 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/postcard/satellite?address=${encodeURIComponent(preset.address)}&zoom=20`}
                alt={`Satellite view of ${preset.address}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs text-stone-500 mt-2">
              The actual roof at this address.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-500 mb-2 font-medium">
              Generated 3D model
            </div>
            <RoofRender3D scene={scene} />
            <div className="text-xs text-stone-500 mt-2">
              {trace
                ? "Built from Vision-traced roof planes."
                : 'Fallback: hand-drawn footprint. Click "Trace with Vision" above.'}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl p-6 border border-stone-200">
          <h2 className="font-semibold text-stone-900 mb-3">Pipeline</h2>
          <ol className="space-y-2 text-sm text-stone-700 list-decimal list-inside">
            <li>Google Static Maps satellite (zoom 20, scale 2)</li>
            <li>Claude Sonnet 4.5 vision tool-call → roof planes + pitch + color (~$0.03)</li>
            <li>Image-pixel polygons → world feet via known map scale</li>
            <li>Eave vertices at z=0; ridge/hip-end vertices lifted by pitch × distance-to-eave</li>
            <li>Same Three.js viewer as ruufpro.com — drag, scroll, hover planes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
