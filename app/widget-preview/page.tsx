// Preview page for the estimate widget during development.
// Visit localhost:3000/widget-preview to see it.

import EstimateWidget from "@/components/estimate-widget";

export default function WidgetPreviewPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-xl mx-auto mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Widget Preview
        </h1>
        <p className="text-gray-500 text-sm">
          This is how the estimate widget looks on a contractor's site.
          The API call won't work without a real contractor set up, but
          you can click through the UI flow.
        </p>
      </div>

      <EstimateWidget
        contractorId="preview-test"
        contractorName="Best Roofing Company"
        contractorPhone="(555) 123-4567"
      />
    </main>
  );
}
