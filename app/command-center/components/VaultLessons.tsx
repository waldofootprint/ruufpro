"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { VaultRelevance, VaultTopic } from "@/lib/command-center";
import { RELEVANCE_CONFIG, TOPIC_LABELS } from "@/lib/command-center";
import { VAULT_ENTRIES } from "../vault/vault-data";

const RELEVANCE_ORDER: VaultRelevance[] = ["high", "medium", "low"];
const RELEVANCE_HEADERS: Record<VaultRelevance, string> = {
  high: "High Relevance — Directly Drives RuufPro Revenue",
  medium: "Medium — Useful Tactics, Apply When Ready",
  low: "Reference — Technical & Background",
};

export default function VaultLessons() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterRelevance, setFilterRelevance] = useState<VaultRelevance | "all">("all");
  const [filterTopic, setFilterTopic] = useState<VaultTopic | "all">("all");

  const filtered = VAULT_ENTRIES.filter((e) => {
    if (filterRelevance !== "all" && e.relevance !== filterRelevance) return false;
    if (filterTopic !== "all" && e.topic !== filterTopic) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Recommended next steps */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <h3 className="text-[12px] font-semibold text-indigo-300 uppercase tracking-wider">Based on the Vault — My Top 3 Recommendations</h3>
        </div>
        <div className="space-y-3">
          {[
            { text: "I'll scrape 5 roofing companies in your city, build their sites with the widget, and prepare contact form submissions for your approval.", sources: "[005, 016]" },
            { text: "I'll find 3 active roofing Facebook groups, draft 5 value-add comments, and queue them for your approval before posting.", sources: "[030, 034]" },
            { text: "I'll draft 10 cold emails targeting roofers in secondary cities who don't rank for 'roofing contractor [city]' — ready for your review.", sources: "[033, 047]" },
          ].map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg">
              <span className="text-emerald-400 font-bold text-sm mt-0.5">{i + 1}.</span>
              <div>
                <p className="text-[13px] text-white font-medium">{rec.text}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{rec.sources}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterRelevance}
          onChange={(e) => setFilterRelevance(e.target.value as VaultRelevance | "all")}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-slate-300 focus:outline-none focus:border-indigo-500/40"
        >
          <option value="all">All Relevance</option>
          <option value="high">High Relevance</option>
          <option value="medium">Medium</option>
          <option value="low">Reference</option>
        </select>
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value as VaultTopic | "all")}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-slate-300 focus:outline-none focus:border-indigo-500/40"
        >
          <option value="all">All Topics</option>
          {Object.entries(TOPIC_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-[11px] text-slate-600 self-center ml-2">{filtered.length} entries</span>
      </div>

      {/* Entries grouped by relevance */}
      {RELEVANCE_ORDER.map((rel) => {
        const group = filtered.filter((e) => e.relevance === rel);
        if (group.length === 0) return null;
        const cfg = RELEVANCE_CONFIG[rel];

        return (
          <div key={rel}>
            <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {RELEVANCE_HEADERS[rel]}
              <span className="text-slate-600">({group.length})</span>
            </h3>
            <div className="space-y-2">
              {group.map((entry) => {
                const isOpen = expanded === entry.entry;
                const topicLabel = TOPIC_LABELS[entry.topic];

                return (
                  <div
                    key={entry.entry}
                    className={`bg-white/[0.03] border-l-2 ${cfg.border} border border-l-2 border-white/[0.06] rounded-r-xl rounded-l overflow-hidden transition-colors ${
                      isOpen ? "border-white/10" : "hover:border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : entry.entry)}
                      className="w-full p-4 flex items-start gap-3 text-left"
                    >
                      <span className="text-[11px] text-slate-600 font-mono mt-0.5 w-8 shrink-0">[{entry.entry}]</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white font-medium">{entry.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">{entry.speaker}</span>
                          <span className="text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded">{topicLabel}</span>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 ml-11">
                        <div>
                          <h4 className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">Summary</h4>
                          <p className="text-[13px] text-slate-300 leading-relaxed">{entry.summary}</p>
                        </div>
                        <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-lg p-4">
                          <h4 className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold mb-1.5">How This Applies to RuufPro</h4>
                          <p className="text-[13px] text-slate-300 leading-relaxed">{entry.ruufpro}</p>
                        </div>
                        <Link
                          href={`/command-center/vault/${entry.entry}`}
                          className="inline-flex items-center gap-1.5 text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          View full details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
