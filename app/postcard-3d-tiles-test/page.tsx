"use client";

import { useEffect, useRef, useState } from "react";

const TEST_ADDRESS = "8734 54th Ave E, Bradenton, FL";
const TEST_LAT = 27.439986;
const TEST_LNG = -82.44778939999999;

export default function Postcard3DTilesTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>("loading…");
  const [error, setError] = useState<string | null>(null);
  const [tileCount, setTileCount] = useState(0);

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
        setStatus("loading three.js + 3d-tiles-renderer…");
        const THREE = await import("three");
        const tilesMod: any = await import("3d-tiles-renderer");
        const threeMod: any = await import("3d-tiles-renderer/three");
        const pluginsMod: any = await import("3d-tiles-renderer/plugins");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

        const TilesRenderer = tilesMod.TilesRenderer ?? threeMod.TilesRenderer;
        const GoogleCloudAuthPlugin =
          pluginsMod.GoogleCloudAuthPlugin ?? tilesMod.GoogleCloudAuthPlugin;
        const TileCompressionPlugin =
          pluginsMod.TileCompressionPlugin ?? tilesMod.TileCompressionPlugin;
        const WGS84_ELLIPSOID = threeMod.WGS84_ELLIPSOID ?? tilesMod.WGS84_ELLIPSOID;

        if (!TilesRenderer || !GoogleCloudAuthPlugin || !WGS84_ELLIPSOID) {
          throw new Error(
            `missing exports: TilesRenderer=${!!TilesRenderer} Plugin=${!!GoogleCloudAuthPlugin} WGS=${!!WGS84_ELLIPSOID}`
          );
        }

        if (cancelled || !containerRef.current) return;
        const container = containerRef.current;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#f4ede1");

        const camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 50000);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(200, 400, 200);
        scene.add(dir);

        setStatus("connecting to Google Photorealistic 3D Tiles…");
        const tiles = new TilesRenderer();
        tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: apiKey }));
        if (TileCompressionPlugin) {
          try { tiles.registerPlugin(new TileCompressionPlugin()); } catch {}
        }
        tiles.setCamera(camera);
        tiles.setResolutionFromRenderer(camera, renderer);

        // Orient the tiles so our test location is at origin
        // ENU frame: X=east, Y=north, Z=up. We want Y-up for three.js.
        // So we apply: inverse(ENU) then rotateX(-90°) which maps ENU-Z (up) → world-Y (up)
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

        // Camera: ~250m south, ~150m up → angled "real-estate listing" view
        camera.position.set(0, 150, 250);
        camera.lookAt(0, 0, 0);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0, 0);
        controls.minDistance = 50;
        controls.maxDistance = 1500;
        controls.maxPolarAngle = Math.PI / 2.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;
        controls.update();

        let firstLoad = false;
        let loaded = 0;
        tiles.addEventListener("load-tile-set", () => {
          if (!firstLoad) {
            setStatus("tiles loading…");
            firstLoad = true;
          }
        });
        tiles.addEventListener("load-model", () => {
          loaded++;
          setTileCount(loaded);
        });
        tiles.addEventListener("tiles-load-end", () => {
          setStatus("ready · drag to rotate · scroll to zoom");
        });

        const animate = () => {
          if (cancelled) return;
          requestAnimationFrame(animate);
          controls.update();
          camera.updateMatrixWorld();
          tiles.update();
          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
          if (!container) return;
          camera.aspect = container.clientWidth / container.clientHeight;
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

  return (
    <div className="min-h-screen bg-[#f4ede1] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3 text-[10px] uppercase tracking-widest text-orange-600 font-bold">
          Spot-check · Google Photorealistic 3D Tiles
        </div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">{TEST_ADDRESS}</h1>
        <div className="text-sm text-stone-600 mb-4">
          {TEST_LAT.toFixed(6)}, {TEST_LNG.toFixed(6)}
        </div>

        <div
          ref={containerRef}
          className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-stone-100 ring-1 ring-stone-300 shadow-lg"
        />

        <div className="mt-3 px-4 py-3 bg-white rounded-xl border border-stone-200 text-sm">
          {error ? (
            <span className="text-red-700">⚠ {error}</span>
          ) : (
            <span className="text-stone-700">
              {status} · tiles loaded: <strong>{tileCount}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
