// This page renders a contractor's site.
// The [slug] in the folder name is a dynamic parameter —
// when someone visits "joes-roofing.roofready.com", the middleware
// rewrites it to "/site/joes-roofing", and Next.js passes
// { params: { slug: "joes-roofing" } } to this component.
//
// For now, this is a placeholder. Once Supabase is connected,
// we'll look up the contractor's data by slug and render their template.

export default async function ContractorSite({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  return (
    <main className="min-h-screen bg-white">
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </h1>
        <p className="text-gray-500 mb-2">
          This contractor site is being set up.
        </p>
        <p className="text-sm text-gray-400">
          Powered by{" "}
          <a href="https://roofready.com" className="text-brand-600 underline">
            RoofReady
          </a>
        </p>
      </div>
    </main>
  );
}
