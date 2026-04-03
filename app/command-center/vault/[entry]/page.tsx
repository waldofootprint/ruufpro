"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VAULT_ENTRIES } from "../vault-data";
import { RELEVANCE_CONFIG, TOPIC_LABELS } from "@/lib/command-center";

export default function VaultDetailPage() {
  const { entry } = useParams<{ entry: string }>();
  const item = VAULT_ENTRIES.find((v) => v.entry === entry);

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/command-center" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Command Center
        </Link>
        <p className="text-slate-400">Vault entry not found.</p>
      </div>
    );
  }

  const relCfg = RELEVANCE_CONFIG[item.relevance];
  const topicLabel = TOPIC_LABELS[item.topic];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link href="/command-center" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Command Center
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-slate-500 font-mono">[{item.entry}]</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${relCfg.color}`}>{relCfg.label}</span>
          <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded">{topicLabel}</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{item.title}</h1>
        <p className="text-[14px] text-slate-500 mt-1">{item.speaker}</p>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-3">Summary</h3>
          <p className="text-[14px] text-slate-200 leading-relaxed">{item.summary}</p>
        </div>

        {/* How This Applies to RuufPro */}
        <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-6">
          <h3 className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold mb-3">How This Applies to RuufPro</h3>
          <p className="text-[14px] text-slate-200 leading-relaxed">{item.ruufpro}</p>
        </div>

        {/* Link to vault file */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Source File</h3>
          <p className="text-[12px] text-slate-500 font-mono">AI Automations/transcripts/processed/{item.entry}-*.md</p>
        </div>
      </div>
    </div>
  );
}
