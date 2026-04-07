// Preview page for the estimate widget during development.
// Visit localhost:3000/widget-preview to see both dark and light variants.

import EstimateWidgetV4 from "@/components/estimate-widget-v4";

export default function WidgetPreviewPage() {
  const demoProps = {
    contractorId: "c2a1286d-4faa-444a-b5b7-99f592359f80",
    contractorName: "Apex Roofing",
    contractorPhone: "(555) 123-4567",
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Widget Preview — V4
        </h1>
        <p className="text-gray-500 text-sm">
          Dark variant (for dark template backgrounds) and Light variant (for light template backgrounds).
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Dark variant on dark background */}
        <div>
          <p className="text-center text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Dark Variant</p>
          <div className="rounded-2xl p-8" style={{ background: "#1A1A2E" }}>
            <EstimateWidgetV4 {...demoProps} variant="dark" />
          </div>
        </div>

        {/* Light variant on light background */}
        <div>
          <p className="text-center text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Light Variant</p>
          <div className="rounded-2xl p-8" style={{ background: "#F7F8FA", border: "1px solid #EAEAE6" }}>
            <EstimateWidgetV4 {...demoProps} variant="light" />
          </div>
        </div>
      </div>
    </main>
  );
}
