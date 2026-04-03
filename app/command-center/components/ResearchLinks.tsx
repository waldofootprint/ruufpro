"use client";

import Link from "next/link";
import { FileText, ExternalLink, ChevronRight, Paintbrush } from "lucide-react";
import { QUICK_LINKS } from "@/lib/command-center";
import { RESEARCH_ENTRIES } from "../research/research-data";

interface TemplateCard {
  name: string;
  route: string | null;
  status: "complete" | "needs_work";
  desc: string;
  colors: { label: string; hex: string }[];
  headingFont: string;
  bodyFont: string;
}

const TEMPLATES: TemplateCard[] = [
  {
    name: "Modern Clean", route: "/demo", status: "complete",
    desc: "Premium scroll animations, material transformation hero. Apple-style design.",
    colors: [{ label: "BG", hex: "#FFFFFF" }, { label: "Primary", hex: "#1E3A5F" }, { label: "Accent", hex: "#E8720C" }, { label: "Text", hex: "#1A1A2E" }],
    headingFont: "Sora", bodyFont: "DM Sans",
  },
  {
    name: "Chalkboard", route: "/demo/chalkboard", status: "complete",
    desc: "Dark green-gray with chalk texture. Warm and distinctive.",
    colors: [{ label: "BG", hex: "#2A2D2A" }, { label: "Accent", hex: "#F6C453" }, { label: "Text", hex: "#E8E5D8" }],
    headingFont: "Plus Jakarta Sans", bodyFont: "Plus Jakarta Sans",
  },
  {
    name: "Forge", route: "/demo/forge", status: "complete",
    desc: "Dark industrial design with blue accent nav. Full-bleed hero.",
    colors: [{ label: "BG", hex: "#0D0D0D" }, { label: "Accent", hex: "#2E5090" }, { label: "Text", hex: "#FFFFFF" }],
    headingFont: "Inter", bodyFont: "Inter",
  },
  {
    name: "Blueprint", route: "/demo/blueprint", status: "complete",
    desc: "Cool light tones with slate blue accents. Technical, trustworthy.",
    colors: [{ label: "BG", hex: "#F5F7FA" }, { label: "Accent", hex: "#4A6FA5" }, { label: "Text", hex: "#0F172A" }],
    headingFont: "Plus Jakarta Sans", bodyFont: "Plus Jakarta Sans",
  },
  {
    name: "Classic", route: "/demo/classic", status: "complete",
    desc: "Traditional design. Clean white with charcoal accents. Corporate trust.",
    colors: [{ label: "BG", hex: "#FFFFFF" }, { label: "Accent", hex: "#2D2D2D" }, { label: "Text", hex: "#1C1C1C" }],
    headingFont: "Inter", bodyFont: "Inter",
  },
  {
    name: "Apex", route: null, status: "needs_work",
    desc: "Soft structuralism. Silver-grey with blue accent. Premium agency feel. Only hero implemented.",
    colors: [{ label: "BG", hex: "#F4F4F5" }, { label: "Accent", hex: "#2563EB" }, { label: "Text", hex: "#18181B" }],
    headingFont: "Outfit", bodyFont: "Outfit",
  },
];

export default function ResearchLinks() {
  return (
    <div className="space-y-8">
      {/* Research docs */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Strategy & Research</h3>
        <div className="space-y-2">
          {RESEARCH_ENTRIES.map((doc) => (
            <Link
              key={doc.slug}
              href={`/command-center/research/${doc.slug}`}
              className="block bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-colors"
            >
              <div className="p-4 flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white font-medium">{doc.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{doc.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Website Templates */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Website Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.name}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors"
            >
              {/* Header: name + status + preview link */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-slate-500" />
                  <p className="text-[14px] text-white font-semibold">{tmpl.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    tmpl.status === "complete"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {tmpl.status === "complete" ? "Complete" : "Needs Work"}
                  </span>
                  {tmpl.route && (
                    <a
                      href={tmpl.route}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Preview <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-500 mb-4">{tmpl.desc}</p>

              {/* Color swatches */}
              <div className="flex items-center gap-3 mb-3">
                {tmpl.colors.map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full border border-white/15 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <p className="text-[9px] text-slate-500 leading-none">{c.label}</p>
                      <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">{c.hex}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Font pairing */}
              <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04]">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Heading</p>
                  <p className="text-[12px] text-white" style={{ fontFamily: `'${tmpl.headingFont}', sans-serif` }}>{tmpl.headingFont}</p>
                </div>
                {tmpl.headingFont !== tmpl.bodyFont && (
                  <>
                    <div className="text-slate-600">+</div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Body</p>
                      <p className="text-[12px] text-white" style={{ fontFamily: `'${tmpl.bodyFont}', sans-serif` }}>{tmpl.bodyFont}</p>
                    </div>
                  </>
                )}
                {tmpl.headingFont === tmpl.bodyFont && (
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Body</p>
                    <p className="text-[12px] text-slate-400">Same</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] text-slate-300 hover:text-white hover:border-white/10 transition-colors"
            >
              {link.label}
              {link.external && <ExternalLink className="w-3 h-3 text-slate-500" />}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
