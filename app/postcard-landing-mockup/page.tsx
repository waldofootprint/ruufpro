"use client";

import { useEffect, useRef, useState } from "react";

// Hannah's home — same coords as the 3D Tiles winner prototype.
const TEST_ADDRESS = "8734 54th Ave E";
const TEST_CITY = "Bradenton, FL 34211";
const TEST_LAT = 27.439986;
const TEST_LNG = -82.44778939999999;

// Stub data — what we'd compute server-side from
// property_pipeline_candidates + NOAA HURDAT2 + Accela + FEMA at request time.
// All three storm fields are pre-computable once-per-year per (lat,lng,yearBuilt).
const STUB = {
  yearBuilt: 2004,
  roofAgeYears: 21,
  lastPermitYear: null as number | null, // null = no permit on file
  femaZone: "X",
  msfhEligible: true,
  // From NOAA HURDAT2 — Cat 3+ storms within 75mi of address since year-built
  majorHurricanesSinceBuilt: 3,
  // From NOAA HURDAT2 — max sustained wind from track points within 25mi during roof life
  peakWind: { mph: 98, stormName: "Milton", year: 2024 },
  contractor: {
    name: "Stormline Roofing",
    license: "CCC1330842",
    rating: 4.9,
    reviews: 187,
  },
};

export default function PostcardLandingMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const roofLabelRef = useRef<HTMLDivElement>(null);
  const [tilesReady, setTilesReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set");
      return;
    }
    if (!containerRef.current) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const THREE = await import("three");
        const tilesMod: any = await import("3d-tiles-renderer");
        const threeMod: any = await import("3d-tiles-renderer/three");
        const pluginsMod: any = await import("3d-tiles-renderer/plugins");
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );

        const TilesRenderer = tilesMod.TilesRenderer ?? threeMod.TilesRenderer;
        const GoogleCloudAuthPlugin =
          pluginsMod.GoogleCloudAuthPlugin ?? tilesMod.GoogleCloudAuthPlugin;
        const TileCompressionPlugin =
          pluginsMod.TileCompressionPlugin ?? tilesMod.TileCompressionPlugin;
        const WGS84_ELLIPSOID = threeMod.WGS84_ELLIPSOID ?? tilesMod.WGS84_ELLIPSOID;

        if (!TilesRenderer || !GoogleCloudAuthPlugin || !WGS84_ELLIPSOID) {
          throw new Error("3d-tiles-renderer exports missing");
        }

        if (cancelled || !containerRef.current) return;
        const container = containerRef.current;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#0c0a08");

        const camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 50000);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(200, 400, 200);
        scene.add(dir);

        const tiles = new TilesRenderer();
        tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: apiKey }));
        if (TileCompressionPlugin) {
          try {
            tiles.registerPlugin(new TileCompressionPlugin());
          } catch {}
        }
        tiles.setCamera(camera);
        tiles.setResolutionFromRenderer(camera, renderer);

        const enu = new THREE.Matrix4();
        WGS84_ELLIPSOID.getEastNorthUpFrame(
          THREE.MathUtils.degToRad(TEST_LAT),
          THREE.MathUtils.degToRad(TEST_LNG),
          0,
          enu
        );
        const invEnu = new THREE.Matrix4().copy(enu).invert();
        const yUpFix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        tiles.group.matrix.copy(yUpFix).multiply(invEnu);
        tiles.group.matrixAutoUpdate = false;

        scene.add(tiles.group);

        camera.position.set(0, 130, 220);
        camera.lookAt(0, 0, 0);

        // Shift the rendered view so the home anchors on the LEFT,
        // out from under the right-rail card.
        const VIEW_OFFSET_X_PCT = 0.2; // 20% rightward window offset → subject appears left
        const applyViewOffset = () => {
          const fw = container.clientWidth;
          const fh = container.clientHeight;
          camera.setViewOffset(fw, fh, fw * VIEW_OFFSET_X_PCT, 0, fw, fh);
        };
        applyViewOffset();

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0, 0);
        controls.minDistance = 60;
        controls.maxDistance = 800;
        controls.maxPolarAngle = Math.PI / 2.1;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.35;
        controls.update();

        tiles.addEventListener("tiles-load-end", () => setTilesReady(true));

        // True 3D anchor for the roof label — discovered via raycast
        // against the loaded photoreal mesh. This makes the label stay
        // glued to the actual rooftop apex from every camera angle, no
        // matter the local terrain elevation or home footprint offset.
        // Initial guess sits high above the address; refined as tiles load.
        const ROOF_LABEL_ANCHOR = new THREE.Vector3(0, 25, 0);
        const projected = new THREE.Vector3();
        const raycaster = new THREE.Raycaster();
        // Cast straight down from way up high. This way we always
        // catch the highest mesh point (the roof), not a side wall.
        const RAY_FROM = new THREE.Vector3(0, 500, 0);
        const RAY_DIR = new THREE.Vector3(0, -1, 0);

        const refineRoofAnchor = () => {
          if (!tiles.group) return;
          raycaster.set(RAY_FROM, RAY_DIR);
          raycaster.far = 1000;
          const hits = raycaster.intersectObject(tiles.group, true);
          if (hits.length > 0) {
            // Highest hit = rooftop apex. Pin label slightly above so the
            // tick-end touches the roof rather than clips through it.
            const topHit = hits.reduce((best, h) =>
              h.point.y > best.point.y ? h : best
            );
            ROOF_LABEL_ANCHOR.set(
              topHit.point.x,
              topHit.point.y + 1.5,
              topHit.point.z
            );
          }
        };

        // Re-refine on each tile load — higher LOD can expose taller geometry.
        tiles.addEventListener("load-model", refineRoofAnchor);
        tiles.addEventListener("tiles-load-end", refineRoofAnchor);

        const updateRoofLabel = () => {
          const el = roofLabelRef.current;
          if (!el || !container) return;
          projected.copy(ROOF_LABEL_ANCHOR).project(camera);
          const fw = container.clientWidth;
          const fh = container.clientHeight;
          // setViewOffset already bakes the horizontal shift into the
          // projection matrix — do NOT subtract it again here, that
          // would double-shift the label off the home.
          const x = (projected.x * 0.5 + 0.5) * fw;
          const y = (-projected.y * 0.5 + 0.5) * fh;
          const dist = camera.position.distanceTo(ROOF_LABEL_ANCHOR);
          const opacity = dist > 700 ? 0 : dist > 500 ? (700 - dist) / 200 : 1;
          el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
          el.style.opacity = String(opacity);
        };

        const animate = () => {
          if (cancelled) return;
          requestAnimationFrame(animate);
          controls.update();
          camera.updateMatrixWorld();
          tiles.update();
          renderer.render(scene, camera);
          updateRoofLabel();
        };
        animate();

        const onResize = () => {
          if (!container) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          applyViewOffset();
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener("resize", onResize);

        cleanup = () => {
          window.removeEventListener("resize", onResize);
          tiles.dispose();
          renderer.dispose();
          if (renderer.domElement.parentElement === container) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (err: any) {
        console.error("3d-tiles error", err);
        setError(err?.message ?? String(err));
      }
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  const permitText = STUB.lastPermitYear
    ? `${new Date().getFullYear() - STUB.lastPermitYear} yr ago`
    : "None on file";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0a08] text-stone-100 antialiased">
      {/* 3D scene — fills the viewport */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading + attribution */}
      {!tilesReady && !error && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] uppercase tracking-[0.18em] text-stone-300">
          loading your home…
        </div>
      )}
      {error && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md bg-red-950/80 border border-red-800 text-xs text-red-200">
          ⚠ {error}
        </div>
      )}

      {/* Floating roof-anchored micro-card — projects from world space */}
      <div
        ref={roofLabelRef}
        className="pointer-events-none absolute top-0 left-0 z-20 will-change-transform"
        style={{ transition: "opacity 240ms ease-out" }}
      >
        <div className="relative flex flex-col items-center">
          {/* Card */}
          <div
            className="relative px-5 py-4 rounded-xl border border-white/[0.09] shadow-[0_12px_36px_-12px_rgba(0,0,0,0.65)]"
            style={{
              background:
                "linear-gradient(180deg, rgba(40,34,28,0.48) 0%, rgba(20,16,12,0.62) 100%)",
              backdropFilter: "blur(18px) saturate(150%)",
              WebkitBackdropFilter: "blur(18px) saturate(150%)",
              minWidth: 220,
            }}
          >
            <div className="absolute -top-px left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#b13d1a]/55 to-transparent" />
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="block w-1 h-1 rounded-full bg-[#b13d1a]" />
              <span className="text-[9px] uppercase tracking-[0.22em] text-stone-300/90">
                On record
              </span>
            </div>
            <div className="space-y-2">
              <RoofStatRow
                label="Roof age"
                value={`~${STUB.roofAgeYears} yrs`}
              />
              <div className="h-px bg-white/[0.07]" />
              <RoofStatRow
                label="Major hurricanes"
                value={`${STUB.majorHurricanesSinceBuilt} since built`}
              />
              <div className="h-px bg-white/[0.07]" />
              <RoofStatRow
                label="Wind on record"
                value={`${STUB.peakWind.mph} mph`}
                sub={`${STUB.peakWind.stormName} '${String(STUB.peakWind.year).slice(-2)}`}
              />
            </div>
          </div>
          {/* Tick line + dot pointing down at roof */}
          <div className="w-px h-5 bg-gradient-to-b from-white/30 to-white/0" />
          <div
            className="w-1.5 h-1.5 rounded-full bg-white/70"
            style={{ boxShadow: "0 0 6px rgba(255,255,255,0.5)" }}
          />
        </div>
      </div>

      {/* Right-edge fade so the card has contrast without darkening the house */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[480px] bg-gradient-to-l from-black/60 via-black/20 to-transparent" />

      {/* Top-left address sliver */}
      <div className="absolute top-6 left-6 flex flex-col gap-0.5 text-stone-300">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-stone-400">
          <span className="block w-1.5 h-1.5 rounded-full bg-[#b13d1a]" />
          Your home
        </div>
        <div className="text-[15px] font-medium text-stone-100">
          {TEST_ADDRESS}
        </div>
        <div className="text-[11px] text-stone-400">{TEST_CITY}</div>
      </div>

      {/* Google attribution (required by 3D Tiles ToS) */}
      <div className="absolute bottom-3 left-6 text-[9px] uppercase tracking-[0.18em] text-stone-500">
        Imagery © Google · Photorealistic 3D Tiles
      </div>

      {/* Floating premium card — right-side rail, glassmorphic, leaves house visible */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-[380px] max-w-[calc(100vw-32px)] z-10 max-h-[calc(100vh-48px)] overflow-y-auto">
        <div
          className="relative rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(28,24,20,0.82) 0%, rgba(18,15,12,0.92) 100%)",
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
          }}
        >
          {/* Hairline rust accent */}
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#b13d1a]/60 to-transparent" />

          <div className="px-6 pt-6 pb-5">
            {/* Roofer = front and center */}
            <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-[0.22em] text-stone-400">
              <span className="block w-1 h-1 rounded-full bg-[#b13d1a]" />
              FL Licensed Roofer
            </div>
            <h1 className="font-serif text-[26px] leading-[1.1] text-stone-50 tracking-tight">
              {STUB.contractor.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-3 text-[12px]">
              <span className="text-[#e8a87c]">
                {STUB.contractor.rating} ★
              </span>
              <span className="text-stone-500">·</span>
              <span className="text-stone-400">
                {STUB.contractor.reviews} Google reviews
              </span>
              <span className="text-stone-500">·</span>
              <span className="text-stone-400 font-mono">
                {STUB.contractor.license}
              </span>
            </div>

            {/* Why you got this card */}
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-[0.16em] text-stone-500 mb-2">
                Why you got the postcard
              </div>
              <p className="text-[14px] leading-relaxed text-stone-200">
                Your roof at {TEST_ADDRESS} has stood through{" "}
                <span className="text-[#e8a87c]">
                  {STUB.roofAgeYears} Florida summers
                </span>{" "}
                and {STUB.majorHurricanesSinceBuilt} major hurricanes. After two decades, it's earned a closer look.
              </p>
            </div>

            {/* Fact grid — 3 tiles, plain English */}
            <div className="mt-5 grid grid-cols-3 border-t border-b border-white/10 divide-x divide-white/10">
              <Fact label="Built" value={String(STUB.yearBuilt)} />
              <Fact
                label="Roof permit"
                value={permitText}
                accent={!STUB.lastPermitYear}
              />
              <Fact label="Flood zone" value={STUB.femaZone} />
            </div>

            {/* Primary CTA */}
            <button
              className="group mt-5 w-full px-5 py-4 rounded-xl bg-stone-50 text-stone-950 font-medium text-[15px] tracking-tight hover:bg-white transition-colors flex items-center justify-between"
              onClick={() => alert("Riley chat would open here")}
            >
              <span>Chat with {STUB.contractor.name}</span>
              <span className="text-stone-400 text-xs group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </button>
            <div className="mt-1.5 text-center text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Powered by Riley AI · answers in seconds
            </div>

            {/* Pre-seeded chips — about the ROOFER, not the roof */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {[
                `Does ${STUB.contractor.name} handle insurance claims?`,
                `What's their warranty?`,
                `How soon can someone come out?`,
                `How much do they charge for a roof this size?`,
              ].map((q) => (
                <button
                  key={q}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-300 hover:bg-white/10 hover:text-stone-100 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* SB 76 footer */}
            <div className="mt-5 pt-4 border-t border-white/10 text-[10px] text-stone-500 leading-relaxed">
              We don't door-knock. We don't pressure insurance claims.
              SB 76 compliant. Stop these mailings:{" "}
              <span className="underline decoration-stone-700">
                ruufpro.com/stop
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoofStatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[9px] uppercase tracking-[0.18em] text-stone-400 whitespace-nowrap">
        {label}
      </span>
      <span className="text-right">
        <span className="font-serif text-[15px] leading-none text-stone-50">
          {value}
        </span>
        {sub && (
          <span className="ml-1.5 text-[10px] text-stone-400 font-light italic">
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

function Fact({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="px-3 py-3.5 first:pl-0 last:pr-0">
      <div className="text-[9px] uppercase tracking-[0.14em] text-stone-500 mb-1">
        {label}
      </div>
      <div
        className={`text-[13px] font-medium leading-tight ${
          accent ? "text-[#e8a87c]" : "text-stone-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
