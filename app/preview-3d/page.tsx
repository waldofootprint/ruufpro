"use client";

import dynamic from "next/dynamic";
import { ThreeScene } from "@/components/ui/three-scene";

const ForgeHouseScene = dynamic(
  () => import("@/components/3d/forge-house") as any,
  { ssr: false }
);

export default function Preview3D() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1A1A1A" }}>
      <ThreeScene className="w-full h-full">
        <ForgeHouseScene />
      </ThreeScene>
    </div>
  );
}
