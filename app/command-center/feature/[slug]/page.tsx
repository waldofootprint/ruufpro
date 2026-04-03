"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ChevronDown, ChevronUp, Circle, Check, Code2 } from "lucide-react";
import { FEATURES, type FeatureDefinition } from "../features-data";

const STATUS_BADGE = {
  complete: { label: "Complete", color: "bg-emerald-500/15 text-emerald-400" },
  in_progress: { label: "In Progress", color: "bg-amber-500/15 text-amber-400" },
  planned: { label: "Planned", color: "bg-blue-500/15 text-blue-400" },
};

export default function FeatureDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showTechnical, setShowTechnical] = useState(false);
  const feature = FEATURES.find((f) => f.slug === slug);

  if (!feature) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/mission-control" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Mission Control
        </Link>
        <p className="text-slate-400">Feature not found.</p>
      </div>
    );
  }

  const badge = STATUS_BADGE[feature.status];
  const hasSteps = feature.buildSteps && feature.buildSteps.length > 0;
  const stepsComplete = feature.buildSteps?.filter((s) => s.done).length || 0;
  const stepsTotal = feature.buildSteps?.length || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link href="/mission-control" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Mission Control
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">{feature.name}</h1>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        {hasSteps && (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${feature.status === "complete" ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: feature.status === "complete" ? "100%" : `${stepsTotal > 0 ? (stepsComplete / stepsTotal) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[12px] text-slate-500">
              {feature.status === "complete" ? "100%" : `${stepsComplete}/${stepsTotal} steps`}
            </span>
          </div>
        )}
      </div>

      {/* Business Summary */}
      <div className="space-y-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">What It Does</h3>
          <p className="text-[14px] text-slate-200 leading-relaxed">{feature.businessSummary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold mb-2">Value for Roofers</h3>
            <p className="text-[13px] text-slate-300 leading-relaxed">{feature.rooferValue}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold mb-2">Revenue Impact</h3>
            <p className="text-[13px] text-slate-300 leading-relaxed">{feature.revenueImpact}</p>
          </div>
        </div>

        {/* Live Links */}
        {feature.liveLinks.length > 0 && (
          <div>
            <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">See It Live</h3>
            <div className="flex flex-wrap gap-2">
              {feature.liveLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[12px] text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/30 transition-colors"
                >
                  {link.label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Requirements + Vault Reasoning (for planned/in-progress) */}
        {feature.requirements && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Requirements</h3>
            <p className="text-[13px] text-slate-300 leading-relaxed">{feature.requirements}</p>
          </div>
        )}

        {feature.vaultReasoning && (
          <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-5">
            <h3 className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold mb-2">Vault Reasoning</h3>
            <p className="text-[13px] text-slate-300 leading-relaxed">{feature.vaultReasoning}</p>
          </div>
        )}

        {/* Build Steps (to-do list for planned/in-progress) */}
        {hasSteps && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.04]">
              <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                {feature.status === "planned" ? "Proposed Build Steps — Approve to Start" : "Build Progress"}
              </h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {feature.buildSteps!.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 w-[18px] h-[18px] min-w-[18px] rounded flex items-center justify-center border ${
                    step.done ? "bg-emerald-500 border-emerald-500" : "border-white/15"
                  }`}>
                    {step.done ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <Circle className="w-2 h-2 text-slate-600" />
                    )}
                  </div>
                  <span className={`text-[13px] leading-relaxed ${step.done ? "text-slate-600 line-through" : "text-slate-300"}`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
            {feature.status === "planned" && (
              <div className="p-4 border-t border-white/[0.04] bg-white/[0.02]">
                <button className="px-4 py-2 bg-emerald-500/15 text-emerald-400 text-[12px] font-medium rounded-lg hover:bg-emerald-500/25 transition-colors">
                  Approve — Start Building This Feature
                </button>
              </div>
            )}
          </div>
        )}

        {/* Technical Details (expandable) */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-500" />
              <span className="text-[12px] text-slate-400 font-medium">Technical Details</span>
            </div>
            {showTechnical ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showTechnical && (
            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04]">
              <div className="pt-4">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Stack</h4>
                <p className="text-[12px] text-slate-300 font-mono">{feature.technical.stack}</p>
              </div>
              {feature.technical.routes.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Routes</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {feature.technical.routes.map((r) => (
                      <span key={r} className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded font-mono">{r}</span>
                    ))}
                  </div>
                </div>
              )}
              {feature.technical.database.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Database Tables</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {feature.technical.database.map((t) => (
                      <span key={t} className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {feature.technical.keyFiles.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Key Files</h4>
                  <div className="space-y-0.5">
                    {feature.technical.keyFiles.map((f) => (
                      <p key={f} className="text-[10px] text-slate-500 font-mono">{f}</p>
                    ))}
                  </div>
                </div>
              )}
              {feature.technical.notes && (
                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Notes</h4>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{feature.technical.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
