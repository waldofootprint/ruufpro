"use client";

import { useEffect, useRef, useState } from "react";

export interface PostcardLandingData {
  address: string;
  city: string;
  lat: number;
  lng: number;
  yearBuilt: number;
  roofAgeYears: number;
  /** Most recent roof permit on file (null = none). */
  lastPermitYear: number | null;
  lastPermitDescription: string | null;
  /** "permit" when a permit drove the age, "year_built" when fallback. */
  roofAgeSource: "permit" | "year_built" | "unknown";
  femaZone: string;
  msfhEligible: boolean;
  majorHurricanesSinceBuilt: number;
  peakWind: { mph: number; stormName: string; year: number };
  contractor: {
    name: string;
    license: string;
    rating: number;
    reviews: number;
  };
}

export default function PostcardLandingClient({ data: STUB }: { data: PostcardLandingData }) {
  const TEST_ADDRESS = STUB.address;
  const TEST_CITY = STUB.city;
  const TEST_LAT = STUB.lat;
  const TEST_LNG = STUB.lng;
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const roofLabelRef = useRef<HTMLDivElement>(null);
  const inFlowCtaRef = useRef<HTMLButtonElement>(null);
  const [tilesReady, setTilesReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctaScrolledPast, setCtaScrolledPast] = useState(false);

  // Show the sticky CTA only when the in-flow CTA has fully scrolled out of view.
  // IntersectionObserver is the right primitive — works regardless of doc height.
  useEffect(() => {
    const target = inFlowCtaRef.current;
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => setCtaScrolledPast(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  // Mobile scroll-driven card fade. Hero height stays constant (72vh) — animating
  // it creates a feedback loop with sticky positioning + doc scroll height. Cards
  // fade out instead, and the content section covers the hero as it rises.
  useEffect(() => {
    const FADE_RANGE = 220;
    const root = document.documentElement;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
          root.style.setProperty("--hero-fade", "1");
          return;
        }
        const t = Math.min(window.scrollY / FADE_RANGE, 1);
        root.style.setProperty("--hero-fade", String(1 - t));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

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

        // Shift the rendered view so the home anchors on the LEFT on
        // desktop (out from under the right-rail card). On mobile the
        // card is a bottom sheet, so we center the home instead.
        const DESKTOP_OFFSET_X_PCT = 0.2;
        // On mobile, push the house ~12% down in the frame so the roof-anchored card
        // has guaranteed room above it (negative y offset = scene shifts down on screen).
        const MOBILE_OFFSET_Y_PCT = -0.12;
        const applyViewOffset = () => {
          const fw = container.clientWidth;
          const fh = container.clientHeight;
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            camera.setViewOffset(fw, fh, 0, fh * MOBILE_OFFSET_Y_PCT, fw, fh);
          } else {
            camera.setViewOffset(fw, fh, fw * DESKTOP_OFFSET_X_PCT, 0, fw, fh);
          }
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
        // ResizeObserver picks up scroll-driven hero compression (CSS var changes
        // height of the container without firing window.resize).
        const ro = new ResizeObserver(onResize);
        ro.observe(container);

        cleanup = () => {
          window.removeEventListener("resize", onResize);
          ro.disconnect();
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

  // All hurricane / wind / age framing is anchored to the ROOF, never the house.
  // When a permit is on file, "this roof" = the reroof. When no permit, "this roof"
  // = the original install (year_built). Either way, the count + copy reads honestly.
  const ageNarrative = STUB.lastPermitYear
    ? `Last reroof permit on file: ${STUB.lastPermitYear}${STUB.lastPermitDescription ? ` (${STUB.lastPermitDescription.toLowerCase()})` : ""}. That's ${STUB.roofAgeYears} Florida summers and ${STUB.majorHurricanesSinceBuilt} major hurricanes this roof has weathered.`
    : `No reroof on record — if it's the original, this roof has weathered ${STUB.roofAgeYears} Florida summers and ${STUB.majorHurricanesSinceBuilt} major hurricanes. Earned a closer look.`;
  const hurricaneSinceLabel = "since this roof";

  return (
    <div className="relative bg-[#0c0a08] text-stone-100 antialiased min-h-screen md:w-screen md:h-screen md:overflow-hidden">
      {/* HERO wrapper — sticky on mobile (compresses on scroll), full-viewport on desktop */}
      <div
        ref={heroRef}
        className="sticky top-0 z-0 w-full overflow-hidden md:static md:overflow-visible h-[72vh] md:h-screen"
      >
        {/* 3D scene — fills hero on mobile, full viewport on desktop */}
        <div
          ref={containerRef}
          className="absolute inset-0 md:fixed md:left-0 md:right-0 md:top-0 md:bottom-0"
        />

        {/* Google attribution (3D Tiles ToS) — pinned to hero so it stays visible
            with the imagery on mobile as page scrolls underneath the sticky hero */}
        <div className="absolute bottom-3 left-5 md:left-6 text-[9px] uppercase tracking-[0.18em] text-stone-500 z-10 pointer-events-none">
          Imagery © Google · Photorealistic 3D Tiles
        </div>
      </div>

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

      {/* Floating roof-anchored micro-card — projects from world space.
          Wrapper adds mobile scroll-fade via --hero-fade (multiplies with JS-set opacity). */}
      <div
        className="pointer-events-none absolute top-0 left-0 z-20 will-change-transform"
        style={{
          opacity: "var(--hero-fade, 1)",
        }}
      >
      <div
        ref={roofLabelRef}
        className="pointer-events-none absolute top-0 left-0 will-change-transform"
        style={{ transition: "opacity 240ms ease-out" }}
      >
        <div className="relative flex flex-col items-center">
          {/* Card */}
          <div
            className="relative px-3.5 py-3 md:px-5 md:py-4 rounded-xl border border-white/[0.09] shadow-[0_12px_36px_-12px_rgba(0,0,0,0.65)] min-w-[170px] md:min-w-[220px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(40,34,28,0.58) 0%, rgba(20,16,12,0.72) 100%)",
              backdropFilter: "blur(18px) saturate(150%)",
              WebkitBackdropFilter: "blur(18px) saturate(150%)",
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
                value={`${STUB.majorHurricanesSinceBuilt} ${hurricaneSinceLabel}`}
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
      </div>

      {/* Right-edge fade so the card has contrast without darkening the house — desktop only */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[480px] bg-gradient-to-l from-black/60 via-black/20 to-transparent hidden md:block" />

      {/* (mobile bottom-edge fade removed — replaced by normal-flow content section below) */}

      {/* Top-left address sliver — desktop layout */}
      <div className="absolute top-6 left-6 hidden md:flex flex-col gap-0.5 text-stone-300">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-stone-400">
          <span className="block w-1.5 h-1.5 rounded-full bg-[#b13d1a]" />
          Your home
        </div>
        <div className="text-[15px] font-medium text-stone-100">
          {TEST_ADDRESS}
        </div>
        <div className="text-[11px] text-stone-400">{TEST_CITY}</div>
      </div>

      {/* Floating premium card — DESKTOP right-side rail, glassmorphic, leaves house visible */}
      <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 w-[380px] max-w-[calc(100vw-32px)] z-10 max-h-[calc(100vh-48px)] overflow-y-auto">
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
                {ageNarrative}
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

      {/* MOBILE content — normal-flow section below the sticky hero. No bottom sheet,
          no internal scroll, no drag handle. Native page scroll. */}
      <section
        className="md:hidden relative z-10 px-5 pt-7 pb-28"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,12,10,0.95) 0%, rgba(12,10,8,1) 18%, rgba(12,10,8,1) 100%)",
        }}
      >
        {/* Hairline rust accent — same language as v1 sheet, no drag handle */}
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#b13d1a]/60 to-transparent" />

        {/* Roofer eyebrow */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-stone-400">
          <span className="block w-1 h-1 rounded-full bg-[#b13d1a]" />
          FL Licensed Roofer
        </div>
        <h1 className="mt-1.5 font-serif text-[24px] leading-[1.1] text-stone-50 tracking-tight">
          {STUB.contractor.name}
        </h1>
        <div className="mt-1.5 flex items-center gap-2 text-[12px] flex-wrap">
          <span className="text-[#e8a87c]">{STUB.contractor.rating} ★</span>
          <span className="text-stone-500">·</span>
          <span className="text-stone-400">
            {STUB.contractor.reviews} Google reviews
          </span>
          <span className="text-stone-500">·</span>
          <span className="text-stone-400 font-mono text-[11px]">
            {STUB.contractor.license}
          </span>
        </div>

        {/* Primary CTA */}
        <button
          ref={inFlowCtaRef}
          className="group mt-4 w-full px-5 py-3.5 rounded-xl bg-stone-50 text-stone-950 font-medium text-[15px] tracking-tight active:bg-white transition-colors flex items-center justify-between"
          onClick={() => alert("Riley chat would open here")}
        >
          <span>Chat with {STUB.contractor.name}</span>
          <span className="text-stone-400 text-xs">→</span>
        </button>
        <div className="mt-1.5 text-center text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Powered by Riley AI · answers in seconds
        </div>

        {/* Why you got the postcard */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="text-[10px] uppercase tracking-[0.16em] text-stone-500 mb-2">
            Why you got the postcard
          </div>
          <p className="text-[14px] leading-relaxed text-stone-200">
            {ageNarrative}
          </p>
        </div>

        {/* Fact grid */}
        <div className="mt-5 grid grid-cols-3 border-t border-b border-white/10 divide-x divide-white/10">
          <Fact label="Built" value={String(STUB.yearBuilt)} />
          <Fact
            label="Roof permit"
            value={permitText}
            accent={!STUB.lastPermitYear}
          />
          <Fact label="Flood zone" value={STUB.femaZone} />
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {[
            `Does ${STUB.contractor.name} handle insurance claims?`,
            `What's their warranty?`,
            `How soon can someone come out?`,
            `How much do they charge for a roof this size?`,
          ].map((q) => (
            <button
              key={q}
              className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-300 active:bg-white/10 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>

        {/* SB 76 footer */}
        <div className="mt-6 pt-4 border-t border-white/10 text-[10px] text-stone-500 leading-relaxed">
          We don't door-knock. We don't pressure insurance claims. SB 76 compliant. Stop these mailings:{" "}
          <span className="underline decoration-stone-700">
            ruufpro.com/stop
          </span>
        </div>
      </section>

      {/* Sticky mobile CTA — appears once user has scrolled past the in-flow CTA */}
      <div
        className="md:hidden fixed left-0 right-0 bottom-0 z-40 px-4 pb-4 pt-3 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,10,8,0) 0%, rgba(12,10,8,0.85) 45%, rgba(12,10,8,0.96) 100%)",
          opacity: ctaScrolledPast ? 1 : 0,
          transform: ctaScrolledPast ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 240ms ease-out, transform 240ms ease-out",
        }}
      >
        <button
          className="pointer-events-auto w-full px-5 py-3.5 rounded-xl bg-stone-50 text-stone-950 font-medium text-[15px] tracking-tight active:bg-white transition-colors flex items-center justify-between shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)]"
          onClick={() => alert("Riley chat would open here")}
        >
          <span>Chat with {STUB.contractor.name}</span>
          <span className="text-stone-400 text-xs">→</span>
        </button>
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
