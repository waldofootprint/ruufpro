import MarketingHero from "@/components/marketing/hero";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            RoofReady
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#demo" className="hover:text-gray-900 transition-colors">Demo</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Start for free
            </a>
          </div>
        </div>
      </nav>

      <MarketingHero />

      {/* Placeholder for remaining sections — we'll build these next */}
      <section className="py-20 text-center text-gray-400">
        <p className="text-sm">More sections coming: Problem → Solution → Demo → Compare → Pricing → FAQ</p>
      </section>
    </main>
  );
}
