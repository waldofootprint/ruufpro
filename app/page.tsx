import MarketingHero from "@/components/marketing/hero";
import GoogleFilter from "@/components/marketing/google-filter";
import Features from "@/components/marketing/features";
import Demo from "@/components/marketing/demo";
import Comparison from "@/components/marketing/comparison";
import HowItWorks from "@/components/marketing/how-it-works";
import Pricing from "@/components/marketing/pricing";
import FAQ from "@/components/marketing/faq";
import FinalCTA from "@/components/marketing/final-cta";

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
              className="relative inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-[1px] active:scale-[0.98]"
            >
              Start for free
            </a>
          </div>
        </div>
      </nav>

      <MarketingHero />
      <GoogleFilter />
      <Features />
      <Demo />
      <HowItWorks />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-white font-bold text-lg">RoofReady</p>
              <p className="text-sm mt-1">Free roofing websites + satellite-powered estimates</p>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="/signup" className="hover:text-white transition-colors">Sign Up</a>
              <a href="/login" className="hover:text-white transition-colors">Log In</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center text-gray-500">
            &copy; {new Date().getFullYear()} RoofReady. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
