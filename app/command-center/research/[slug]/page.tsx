"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, BookOpen, Quote, List, Lightbulb } from "lucide-react";
import { RESEARCH_ENTRIES, type ResearchSection } from "../research-data";

function SectionBlock({ section }: { section: ResearchSection }) {
  const type = section.type || "default";

  if (type === "quote") {
    return (
      <div className="bg-white/[0.03] border-l-2 border-indigo-500/40 rounded-r-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Quote className="w-4 h-4 text-indigo-400" />
          <h3 className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold">
            {section.heading}
          </h3>
        </div>
        <div className="space-y-3">
          {section.content.map((line, i) => (
            <p key={i} className="text-[13px] text-slate-300 leading-relaxed italic">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (type === "callout") {
    return (
      <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold">
            {section.heading}
          </h3>
        </div>
        <div className="space-y-3">
          {section.content.map((line, i) => (
            <p key={i} className="text-[13px] text-slate-200 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <List className="w-4 h-4 text-slate-500" />
          <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            {section.heading}
          </h3>
        </div>
        <ul className="space-y-2.5">
          {section.content.map((line, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-2 shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // default
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-3">
        {section.heading}
      </h3>
      <div className="space-y-3">
        {section.content.map((line, i) => (
          <p key={i} className="text-[13px] text-slate-300 leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ResearchDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const entry = RESEARCH_ENTRIES.find((r) => r.slug === slug);

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/command-center?tab=research"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Research
        </Link>
        <p className="text-slate-400">Research entry not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/command-center?tab=research"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Research
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider font-medium">
            Research
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{entry.label}</h1>
        <p className="text-[14px] text-slate-500 mt-1">{entry.desc}</p>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-3">
            Summary
          </h3>
          <p className="text-[14px] text-slate-200 leading-relaxed">{entry.summary}</p>
        </div>

        {/* Key Takeaway */}
        <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-6">
          <h3 className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold mb-3">
            Key Takeaway
          </h3>
          <p className="text-[14px] text-slate-200 leading-relaxed">{entry.keyTakeaway}</p>
        </div>

        {/* Sections */}
        {entry.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}

        {/* How This Applies to RuufPro */}
        <div className="bg-indigo-500/[0.08] border border-indigo-500/15 rounded-xl p-6">
          <h3 className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold mb-3">
            How This Applies to RuufPro
          </h3>
          <p className="text-[14px] text-slate-200 leading-relaxed">{entry.ruufproImplications}</p>
        </div>

        {/* Sources */}
        {entry.sources.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-3">
              Sources
            </h3>
            <div className="space-y-2">
              {entry.sources.map((source, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-2 shrink-0" />
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                    >
                      {source.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[12px] text-slate-500">{source.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
