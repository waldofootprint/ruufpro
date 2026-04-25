"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Line, useTexture } from "@react-three/drei";
import { useMemo, useState, Suspense } from "react";
import * as THREE from "three";
import type { RoofScene, RoofPlane, Vec3 } from "@/lib/roof-3d-stub-data";

const TEXTURE_REAL_WORLD_FT = 6;

const SKY_TOP = "#cfe6f5";
const SKY_BOTTOM = "#f4ede1";
const EDGE_RIDGE = "#f97316";
const EDGE_HIP = "#fb923c";
const EDGE_VALLEY = "#60a5fa";
const HOVER_COLOR = "#fb923c";

function PlaneMesh({
  plane,
  hovered,
  maps,
  onHover,
}: {
  plane: RoofPlane;
  hovered: boolean;
  maps: { color: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture; ao: THREE.Texture };
  onHover: (id: string | null) => void;
}) {
  const geometry = useMemo(() => {
    const v = plane.vertices.map((p) => new THREE.Vector3(...p));
    const edge = v[1].clone().sub(v[0]).normalize();
    const normal = v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize();
    const vAxis = normal.clone().cross(edge).normalize();
    const origin = v[0];

    const uvs = v.map((p) => {
      const rel = p.clone().sub(origin);
      return [rel.dot(edge) / TEXTURE_REAL_WORLD_FT, rel.dot(vAxis) / TEXTURE_REAL_WORLD_FT];
    });

    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvArr: number[] = [];
    for (let i = 1; i < v.length - 1; i++) {
      positions.push(v[0].x, v[0].y, v[0].z, v[i].x, v[i].y, v[i].z, v[i + 1].x, v[i + 1].y, v[i + 1].z);
      uvArr.push(uvs[0][0], uvs[0][1], uvs[i][0], uvs[i][1], uvs[i + 1][0], uvs[i + 1][1]);
    }
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const uvAttr = new THREE.Float32BufferAttribute(uvArr, 2);
    geom.setAttribute("uv", uvAttr);
    geom.setAttribute("uv2", uvAttr);
    geom.computeVertexNormals();
    return geom;
  }, [plane.vertices]);

  return (
    <mesh
      geometry={geometry}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(plane.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <meshStandardMaterial
        map={maps.color}
        normalMap={maps.normal}
        normalScale={new THREE.Vector2(0.8, 0.8)}
        roughnessMap={maps.rough}
        aoMap={maps.ao}
        aoMapIntensity={1}
        color={hovered ? HOVER_COLOR : "#ffffff"}
        metalness={0.02}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RoofGeometry({
  scene,
  hovered,
  onHover,
}: {
  scene: RoofScene;
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const [color, normal, rough, ao] = useTexture([
    "/textures/shingle-color.jpg",
    "/textures/shingle-normal.jpg",
    "/textures/shingle-rough.jpg",
    "/textures/shingle-ao.jpg",
  ]);

  useMemo(() => {
    [color, normal, rough, ao].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    });
    color.colorSpace = THREE.SRGBColorSpace;
  }, [color, normal, rough, ao]);

  const maps = { color, normal, rough, ao };

  return (
    <>
      {scene.planes.map((plane) => (
        <PlaneMesh
          key={plane.id}
          plane={plane}
          hovered={hovered === plane.id}
          maps={maps}
          onHover={onHover}
        />
      ))}
    </>
  );
}

export function RoofRender3D({ scene }: { scene: RoofScene }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredPlane = scene.planes.find((p) => p.id === hovered);

  const skyStyle = {
    background: `linear-gradient(to bottom, ${SKY_TOP} 0%, ${SKY_TOP} 35%, ${SKY_BOTTOM} 100%)`,
  };

  return (
    <div
      className="relative w-full h-[560px] rounded-2xl overflow-hidden shadow-inner ring-1 ring-stone-200/50"
      style={skyStyle}
    >
      <Canvas
        camera={{ position: [42, 30, 42], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <hemisphereLight args={[SKY_TOP, SKY_BOTTOM, 0.6]} />
          <directionalLight position={[20, 35, 18]} intensity={1.1} />
          <Environment preset="park" />

          <group rotation={[-Math.PI / 2, 0, 0]}>
            <RoofGeometry scene={scene} hovered={hovered} onHover={setHovered} />
            {scene.edges.map((edge) => {
              const color =
                edge.type === "ridge"
                  ? EDGE_RIDGE
                  : edge.type === "hip"
                  ? EDGE_HIP
                  : edge.type === "valley"
                  ? EDGE_VALLEY
                  : "#475569";
              return (
                <Line
                  key={edge.id}
                  points={[edge.start, edge.end] as Vec3[]}
                  color={color}
                  lineWidth={edge.type === "ridge" ? 2.5 : 1.8}
                />
              );
            })}
          </group>

          <OrbitControls
            enablePan={false}
            minDistance={28}
            maxDistance={120}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate
            autoRotateSpeed={0.55}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-4 left-4 px-4 py-3 bg-white/95 backdrop-blur rounded-xl shadow-md">
        <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">
          Roof measured
        </div>
        <div className="text-2xl font-semibold text-stone-900 mt-0.5">
          {scene.totalSqft.toLocaleString()}{" "}
          <span className="text-base font-normal text-stone-500">sqft</span>
        </div>
        <div className="text-sm text-stone-600 mt-1">
          {scene.pitch} pitch · {scene.planes.length} planes
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 px-4 py-2.5 bg-white/95 backdrop-blur rounded-xl shadow-md text-xs">
        <Legend color={EDGE_RIDGE} label="Ridge" />
        <Legend color={EDGE_HIP} label="Hip" />
        <Legend color={EDGE_VALLEY} label="Valley" />
      </div>

      {hoveredPlane && (
        <div className="absolute bottom-4 right-4 px-4 py-3 bg-stone-900/95 text-white rounded-xl shadow-lg text-sm">
          <div className="font-medium capitalize">{hoveredPlane.type} plane</div>
          <div className="text-stone-300 mt-0.5">
            {hoveredPlane.sqft.toLocaleString()} sqft
          </div>
        </div>
      )}

      {!hoveredPlane && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-stone-900/70 text-white text-xs rounded-lg">
          Drag to rotate · Scroll to zoom
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-stone-700 font-medium">{label}</span>
    </div>
  );
}
