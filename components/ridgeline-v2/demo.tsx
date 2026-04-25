// components/ridgeline-v2/demo.tsx
//
// Auto-playing pipeline reveal: address types → 3D roof builds plane-by-plane
// → edges draw on → sqft counts up → price counts up. Triggered when the
// section scrolls into view. Replay button restarts the sequence.

"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LUXURY_FL_ROOF, type RoofScene } from "@/lib/roof-3d-stub-data";

const RoofRender3D = dynamic(
  () => import("@/components/widget/roof-render-3d").then((m) => m.RoofRender3D),
  { ssr: false, loading: () => <div className="h-[420px] w-full bg-[#eef2f5]" /> }
);

const INK = "#0C1F28";
const PAPER = "#FBF7EF";
const SAND = "#F4ECDC";
const LINE = "#E6DDC9";
const RUST = "#C2562A";
const RUST_2 = "#E2855A";
const MUTED = "#6A7580";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';

const TARGET_ADDRESS = LUXURY_FL_ROOF.address;
const SCENE: RoofScene = LUXURY_FL_ROOF;
const TOTAL_SQFT = SCENE.totalSqft;
const PRICE_LOW = Math.round((TOTAL_SQFT * 7) / 100) * 100;
const PRICE_HIGH = Math.round((TOTAL_SQFT * 9) / 100) * 100;

type Phase =
  | "idle"
  | "typing"
  | "submitting"
  | "building"
  | "measuring"
  | "pricing"
  | "done";

function useInView(ref: React.RefObject<HTMLDivElement>, rootMargin = "-20%") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { rootMargin, threshold: 0.1 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

function usePipelineSequence(active: boolean, runKey: number) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState("");
  const [planeCount, setPlaneCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [sqftDisplay, setSqftDisplay] = useState(0);
  const [priceDisplay, setPriceDisplay] = useState(0);

  useEffect(() => {
    setPhase("idle");
    setTyped("");
    setPlaneCount(0);
    setEdgeCount(0);
    setSqftDisplay(0);
    setPriceDisplay(0);
    if (!active) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    timers.push(
      setTimeout(() => {
        setPhase("typing");
        let i = 0;
        const id = setInterval(() => {
          i++;
          setTyped(TARGET_ADDRESS.slice(0, i));
          if (i >= TARGET_ADDRESS.length) clearInterval(id);
        }, 38);
        intervals.push(id);
      }, 500)
    );

    timers.push(setTimeout(() => setPhase("submitting"), 500 + 38 * TARGET_ADDRESS.length + 250));

    const buildStart = 500 + 38 * TARGET_ADDRESS.length + 700;
    timers.push(
      setTimeout(() => {
        setPhase("building");
        let pi = 0;
        const pid = setInterval(() => {
          pi++;
          setPlaneCount(pi);
          if (pi >= SCENE.planes.length) clearInterval(pid);
        }, 280);
        intervals.push(pid);
      }, buildStart)
    );

    const edgeStart = buildStart + 280 * SCENE.planes.length + 200;
    timers.push(
      setTimeout(() => {
        let ei = 0;
        const eid = setInterval(() => {
          ei++;
          setEdgeCount(ei);
          if (ei >= SCENE.edges.length) clearInterval(eid);
        }, 110);
        intervals.push(eid);
      }, edgeStart)
    );

    const measureStart = edgeStart + 110 * SCENE.edges.length + 200;
    timers.push(
      setTimeout(() => {
        setPhase("measuring");
        const start = performance.now();
        const dur = 900;
        const tick = () => {
          const t = Math.min(1, (performance.now() - start) / dur);
          setSqftDisplay(Math.round(t * TOTAL_SQFT));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        let raf = requestAnimationFrame(tick);
        rafIds.push(() => cancelAnimationFrame(raf));
      }, measureStart)
    );

    const priceStart = measureStart + 1000;
    timers.push(
      setTimeout(() => {
        setPhase("pricing");
        const start = performance.now();
        const dur = 1100;
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        const tick = () => {
          const t = Math.min(1, (performance.now() - start) / dur);
          setPriceDisplay(Math.round(ease(t) * PRICE_LOW));
          if (t < 1) raf = requestAnimationFrame(tick);
          else setPhase("done");
        };
        let raf = requestAnimationFrame(tick);
        rafIds.push(() => cancelAnimationFrame(raf));
      }, priceStart)
    );

    const rafIds: Array<() => void> = [];

    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      rafIds.forEach((c) => c());
    };
  }, [active, runKey]);

  return { phase, typed, planeCount, edgeCount, sqftDisplay, priceDisplay };
}

function PipelineCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef);
  const [runKey, setRunKey] = useState(0);
  const { phase, typed, planeCount, edgeCount, sqftDisplay, priceDisplay } =
    usePipelineSequence(inView, runKey);

  const showCaret = phase === "typing" || phase === "idle";
  const submitGlow = phase === "submitting";
  const showResult = phase === "measuring" || phase === "pricing" || phase === "done";

  return (
    <div
      ref={cardRef}
      style={{ backgroundColor: PAPER, color: INK }}
      className="overflow-hidden rounded-md shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]"
    >
      {/* Browser chrome */}
      <div
        style={{ backgroundColor: SAND, borderBottom: `1px solid ${LINE}` }}
        className="flex items-center gap-2 px-4 py-2.5"
      >
        <div className="flex gap-1.5">
          <span style={{ backgroundColor: LINE }} className="h-2.5 w-2.5 rounded-full" />
          <span style={{ backgroundColor: LINE }} className="h-2.5 w-2.5 rounded-full" />
          <span style={{ backgroundColor: LINE }} className="h-2.5 w-2.5 rounded-full" />
        </div>
        <div
          style={{
            backgroundColor: PAPER,
            color: MUTED,
            fontFamily: MONO,
            letterSpacing: "0.04em",
          }}
          className="ml-2 flex-1 rounded px-3 py-1 text-[11px]"
        >
          your-roofing-site.com
        </div>
      </div>

      {/* Address row */}
      <div className="px-6 pt-7 pb-5 md:px-9 md:pt-9">
        <p
          style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="text-[10px] uppercase"
        >
          Free instant estimate
        </p>
        <h3
          style={{
            fontFamily: DISPLAY,
            color: INK,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
          }}
          className="mt-2 text-[26px] font-extrabold uppercase md:text-[32px]"
        >
          Get your roof price in 30 seconds
        </h3>

        <div className="mt-6 flex flex-col gap-2.5 md:flex-row">
          <div className="relative flex-1">
            <label
              style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
              className="block text-[10px] uppercase"
            >
              Property address
            </label>
            <div
              style={{
                backgroundColor: PAPER,
                border: `1px solid ${LINE}`,
                color: INK,
              }}
              className="mt-2 flex min-h-[46px] items-center rounded px-3.5 py-3 text-[14px]"
            >
              <span>{typed || ""}</span>
              {!typed && (
                <span style={{ color: INK, opacity: 0.4 }}>{TARGET_ADDRESS}</span>
              )}
              {showCaret && (
                <span
                  style={{ backgroundColor: RUST }}
                  className="ml-0.5 inline-block h-[16px] w-[2px] animate-pulse"
                />
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRunKey((k) => k + 1)}
            style={{
              backgroundColor: RUST,
              color: PAPER,
              boxShadow: submitGlow
                ? `0 0 0 4px ${RUST_2}55, 0 0 24px ${RUST}88`
                : "none",
              transition: "box-shadow 220ms ease",
            }}
            className="self-end rounded px-5 py-3 text-[12px] font-semibold uppercase tracking-wide hover:opacity-90"
          >
            Get my estimate →
          </button>
        </div>
      </div>

      {/* 3D viewport */}
      <div
        style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}
        className="relative"
      >
        <RoofRender3D
          scene={SCENE}
          revealCount={planeCount}
          revealEdgeCount={edgeCount}
          showOverlays={false}
          enableInteraction={phase === "done"}
          autoRotate
          height={420}
          cameraPosition={[80, 32, 80]}
          cameraFov={30}
          className="relative w-full overflow-hidden"
        />

        {/* Status pill */}
        <div
          style={{
            backgroundColor: "rgba(12,31,40,0.92)",
            color: PAPER,
            fontFamily: MONO,
            letterSpacing: "0.14em",
          }}
          className="absolute left-4 top-4 rounded px-3 py-1.5 text-[10px] uppercase backdrop-blur"
        >
          {phase === "idle" && "Awaiting input"}
          {phase === "typing" && "● Receiving address"}
          {phase === "submitting" && "● Querying satellite"}
          {phase === "building" && `● Reconstructing roof · ${planeCount}/${SCENE.planes.length} planes`}
          {phase === "measuring" && "● Measuring surface area"}
          {phase === "pricing" && "● Calculating price"}
          {phase === "done" && "✓ Estimate ready · drag to explore"}
        </div>

        {/* Live measurement chip — appears with sqft */}
        {sqftDisplay > 0 && (
          <div
            style={{ backgroundColor: PAPER, color: INK, border: `1px solid ${LINE}` }}
            className="absolute right-4 top-4 rounded px-3 py-2 shadow-md"
          >
            <p
              style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
              className="text-[9px] uppercase"
            >
              Roof measured
            </p>
            <p
              style={{ fontFamily: DISPLAY, lineHeight: 0.95 }}
              className="mt-0.5 text-[22px] font-extrabold"
            >
              {sqftDisplay.toLocaleString()}{" "}
              <span style={{ color: MUTED }} className="text-[12px] font-normal">
                sqft
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Result row */}
      <div
        style={{ backgroundColor: PAPER }}
        className={`flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-9 md:py-6 ${
          showResult ? "opacity-100" : "opacity-40"
        } transition-opacity duration-500`}
      >
        <div>
          <p
            style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
            className="text-[10px] uppercase"
          >
            Estimate
          </p>
          <p
            style={{
              fontFamily: DISPLAY,
              color: RUST,
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
            }}
            className="mt-1 text-[32px] font-extrabold md:text-[40px]"
          >
            ${priceDisplay.toLocaleString()}
            {phase === "done" && (
              <span style={{ color: INK }}> — ${PRICE_HIGH.toLocaleString()}</span>
            )}
          </p>
          <p style={{ color: MUTED }} className="mt-1 text-[12px]">
            {SCENE.planes.length} planes · {SCENE.pitch} pitch · Asphalt shingle
          </p>
        </div>

        {phase === "done" && (
          <button
            type="button"
            onClick={() => setRunKey((k) => k + 1)}
            style={{
              border: `1px solid ${LINE}`,
              color: INK,
              fontFamily: MONO,
              letterSpacing: "0.14em",
            }}
            className="self-start rounded px-3 py-2 text-[10px] uppercase hover:bg-[#F4ECDC] md:self-auto"
          >
            ↻ Replay
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Section ─── */
export default function DemoV2() {
  return (
    <section id="demo" style={{ backgroundColor: INK, color: PAPER }} className="w-full">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
        <p
          style={{ color: RUST_2, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="text-[11px] uppercase"
        >
          Live demo · how it works
        </p>

        <h2
          style={{
            fontFamily: DISPLAY,
            color: PAPER,
            lineHeight: 1.0,
            letterSpacing: "-0.01em",
          }}
          className="mt-4 text-[44px] font-extrabold uppercase md:text-[68px]"
        >
          Type an address.{" "}
          <span style={{ color: RUST_2 }}>Watch it work.</span>
        </h2>

        <p
          style={{ color: "rgba(251, 247, 239, 0.7)" }}
          className="mt-6 max-w-[58ch] text-base leading-relaxed md:text-[17px]"
        >
          This is the exact widget homeowners use on your site. Drop in any
          address — the satellite measures the roof, the price appears, the
          lead lands in your inbox.
        </p>

        <div className="mx-auto mt-12 max-w-[760px] md:mt-16">
          <PipelineCard />
        </div>
      </div>
    </section>
  );
}
