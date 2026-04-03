"use client";

import { useState } from "react";
import { ExternalLink, Monitor, Smartphone, Maximize2 } from "lucide-react";

type ViewMode = "desktop" | "mobile";

const FLOW_STEPS = [
  {
    number: 1,
    title: "Simple Form",
    description: "4 fields: business name, phone, city, state. One button: 'Build My Site →'",
    status: "shipped" as const,
  },
  {
    number: 2,
    title: "Magic Generation",
    description: "Animated loading screen — checks off 5 steps (hero, trust badges, service pages, city pages, SEO). UX theater while defaults generate instantly.",
    status: "shipped" as const,
  },
  {
    number: 3,
    title: "Full Edit Mode",
    description: "Two-column layout: edit panel (left) + live preview (right). Template picker, hero editor, services chips, trust signal toggles, about textarea, city tag input. Preview renders the REAL template at 0.32 scale with scroll sync.",
    status: "shipped" as const,
  },
];

export default function OnboardingPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeWidth = viewMode === "mobile" ? "max-w-[390px]" : "w-full";

  return (
    <div className="space-y-6">
      {/* Flow Overview */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Onboarding Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FLOW_STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-[11px] font-bold text-emerald-400">
                  {step.number}
                </div>
                <span className="text-[13px] font-medium text-white">{step.title}</span>
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                  Shipped
                </span>
              </div>
              <p className="text-[12px] text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview Controls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Live Preview — What Clients See</h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/[0.05] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  viewMode === "desktop" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  viewMode === "mobile" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] rounded-lg text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" /> {isFullscreen ? "Exit" : "Expand"}
            </button>
            <a
              href="/onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] rounded-lg text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open
            </a>
          </div>
        </div>

        {/* Iframe Container */}
        <div className={`bg-white rounded-xl overflow-hidden border border-white/[0.08] transition-all ${
          isFullscreen ? "fixed inset-4 z-50" : ""
        }`}>
          {isFullscreen && (
            <div className="bg-slate-900 border-b border-white/[0.08] px-4 py-2 flex items-center justify-between">
              <span className="text-[12px] text-slate-400 font-medium">Onboarding Preview</span>
              <div className="flex items-center gap-2">
                <div className="flex bg-white/[0.05] rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      viewMode === "desktop" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    onClick={() => setViewMode("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      viewMode === "mobile" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="text-[11px] text-slate-400 hover:text-white px-3 py-1.5 bg-white/[0.05] rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          <div className={`flex justify-center ${isFullscreen ? "h-[calc(100%-44px)]" : ""} bg-slate-100`}>
            <iframe
              src="/onboarding"
              className={`${iframeWidth} border-0 ${isFullscreen ? "h-full" : "h-[700px]"}`}
              title="Onboarding Preview"
            />
          </div>
        </div>
      </div>

      {/* Tech Notes */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h4 className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Technical Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-slate-400">
          <div>
            <p className="text-slate-300 font-medium mb-1">Key Files</p>
            <ul className="space-y-1">
              <li><code className="text-[11px] bg-white/[0.05] px-1.5 py-0.5 rounded">app/onboarding/page.tsx</code> — Main flow</li>
              <li><code className="text-[11px] bg-white/[0.05] px-1.5 py-0.5 rounded">components/onboarding/live-preview.tsx</code> — Real template preview</li>
              <li><code className="text-[11px] bg-white/[0.05] px-1.5 py-0.5 rounded">components/onboarding/loading-screen.tsx</code> — Magic generation</li>
              <li><code className="text-[11px] bg-white/[0.05] px-1.5 py-0.5 rounded">components/onboarding/hero-editor.tsx</code> — Hero customization</li>
            </ul>
          </div>
          <div>
            <p className="text-slate-300 font-medium mb-1">Status & Notes</p>
            <ul className="space-y-1">
              <li><span className="text-amber-400">Auth bypass active</span> — dev only, revert before deploy</li>
              <li>3 design styles in onboarding (Modern Clean, Bold, Warm)</li>
              <li>handlePublish saves all fields to Supabase</li>
              <li>Service sub-pages auto-create from selected services</li>
              <li>Live preview at 0.32 scale with IntersectionObserver scroll sync</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
