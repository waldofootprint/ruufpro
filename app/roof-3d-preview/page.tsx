import { RoofRender3D } from "@/components/widget/roof-render-3d";
import { STUB_HIP_ROOF } from "@/lib/roof-3d-stub-data";

export const metadata = {
  title: "3D Roof Render Preview",
  robots: "noindex, nofollow",
};

export default function RoofPreviewPage() {
  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-orange-600 font-medium mb-2">Preview · Stub data</div>
          <h1 className="text-3xl font-semibold text-stone-900">See your roof in 3D</h1>
          <p className="text-stone-600 mt-2 text-sm max-w-xl">
            This is what the calculator will show after a homeowner enters their address. Geometry comes from
            Pipeline A LiDAR plane detection. Currently rendering stubbed hip-roof data — wiring real Pipeline A
            output is a separate scope.
          </p>
        </div>

        <RoofRender3D scene={STUB_HIP_ROOF} />

        <div className="mt-8 bg-white rounded-2xl p-6 border border-stone-200">
          <h2 className="font-semibold text-stone-900 mb-3">What you're looking at</h2>
          <ul className="space-y-2 text-sm text-stone-700">
            <li>· {STUB_HIP_ROOF.planes.length} roof planes auto-detected</li>
            <li>· {STUB_HIP_ROOF.edges.filter(e => e.type === "ridge").length} ridge / {STUB_HIP_ROOF.edges.filter(e => e.type === "hip").length} hip lines</li>
            <li>· {STUB_HIP_ROOF.totalSqft.toLocaleString()} sqft total surface area (slope-corrected)</li>
            <li>· Hover any plane to see per-plane sqft</li>
            <li>· Auto-rotates on load · drag to take control · scroll to zoom</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
