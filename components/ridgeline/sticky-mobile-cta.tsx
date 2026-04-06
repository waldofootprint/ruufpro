"use client";

import { Phone, ArrowRight } from "lucide-react";

export default function RidgelineStickyMobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#1B3A4B] border-t border-white/10 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <a
        href="tel:+1"
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-white/10 text-white text-sm font-bold"
      >
        <Phone className="w-4 h-4" />
        Call Now
      </a>
      <a
        href="/signup"
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#D4863E] text-white text-sm font-bold"
      >
        Get My Free Site
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}
