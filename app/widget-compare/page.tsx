import EstimateWidget from "@/components/estimate-widget";
import EstimateWidgetV2 from "@/components/estimate-widget-v2";
import EstimateWidgetV3 from "@/components/estimate-widget-v3";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

export default function WidgetCompare() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6">
      <h1 className="text-center text-2xl font-bold text-gray-900 mb-2">
        Widget Comparison
      </h1>
      <p className="text-center text-sm text-gray-500 mb-10">
        Click through all four side by side to compare the feel
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-[2000px] mx-auto items-start">
        {/* V1 — Current */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            V1 — Current
          </p>
          <EstimateWidget
            contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
            contractorName="Demo Roofing Co"
            contractorPhone="(555) 123-4567"
          />
        </div>

        {/* V2 — Clean Minimal */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            V2 — Clean Minimal
          </p>
          <EstimateWidgetV2
            contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
            contractorName="Demo Roofing Co"
            contractorPhone="(555) 123-4567"
          />
        </div>

        {/* V3 — Apple Design Language */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            V3 — Apple Design
          </p>
          <EstimateWidgetV3
            contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
            contractorName="Demo Roofing Co"
            contractorPhone="(555) 123-4567"
          />
        </div>

        {/* V4 — Glass + 3D Hybrid */}
        <div className="bg-slate-900 rounded-2xl p-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">
            V4 — Glass + 3D Hybrid
          </p>
          <EstimateWidgetV4
            contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
            contractorName="Demo Roofing Co"
            contractorPhone="(555) 123-4567"
          />
        </div>
      </div>
    </div>
  );
}
