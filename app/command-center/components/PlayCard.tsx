"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CommandPlay, PlayStep } from "@/lib/command-center";
import { STATUS_CONFIG, stepProgress } from "@/lib/command-center";

interface Props {
  play: CommandPlay;
  onStatusChange: (id: string, status: CommandPlay["status"]) => void;
  onStepToggle: (playId: string, stepIndex: number, done: boolean) => void;
}

export default function PlayCard({ play, onStatusChange, onStepToggle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const steps = (play.steps as PlayStep[]) || [];
  const progress = stepProgress(steps);
  const statusCfg = STATUS_CONFIG[play.status];

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden transition-colors hover:border-white/10">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[16px] font-semibold text-white leading-snug">{play.title}</h3>
          <select
            value={play.status}
            onChange={(e) => onStatusChange(play.id, e.target.value as CommandPlay["status"])}
            className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border-0 cursor-pointer ${statusCfg.color} bg-opacity-100`}
            style={{ appearance: "auto" }}
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="queued">Queued</option>
          </select>
        </div>

        {play.vault_sources.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {play.vault_sources.map((s) => (
              <span key={s} className="text-[10px] bg-indigo-500/12 text-indigo-400 px-2 py-0.5 rounded">
                [{s}]
              </span>
            ))}
          </div>
        )}

        {play.summary && (
          <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{play.summary}</p>
        )}

        {/* Step progress bar */}
        {steps.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500">{progress}%</span>
          </div>
        )}
      </div>

      {/* Steps (collapsible) */}
      {steps.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-[12px] text-slate-500 hover:text-slate-300 border-t border-white/[0.04] transition-colors"
          >
            <span>{steps.filter((s) => s.done).length}/{steps.length} steps</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="px-5 pb-4 space-y-0">
              {steps.map((step, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 py-2 border-t border-white/[0.03] first:border-0 cursor-pointer group"
                >
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      onStepToggle(play.id, i, !step.done);
                    }}
                    className={`mt-0.5 w-[18px] h-[18px] min-w-[18px] rounded flex items-center justify-center border transition-all ${
                      step.done
                        ? "bg-indigo-500 border-indigo-500"
                        : "border-white/15 group-hover:border-indigo-400/50"
                    }`}
                  >
                    {step.done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[13px] leading-relaxed ${step.done ? "text-slate-600 line-through" : "text-slate-300"}`}>
                    {step.text}
                  </span>
                </label>
              ))}

              {/* Vault details expandable */}
              {play.vault_details && (
                <details className="mt-3 pt-3 border-t border-white/[0.04]">
                  <summary className="text-[12px] text-indigo-400 cursor-pointer hover:text-indigo-300">
                    Vault context & reasoning
                  </summary>
                  <p className="mt-2 text-[12px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                    {play.vault_details}
                  </p>
                </details>
              )}
            </div>
          )}
        </>
      )}

      {/* When to start (for queued plays) */}
      {play.when_to_start && play.status === "queued" && (
        <div className="px-5 py-2.5 border-t border-white/[0.04]">
          <p className="text-[11px] text-slate-500">
            <span className="text-slate-400 font-medium">Start when:</span> {play.when_to_start}
          </p>
        </div>
      )}
    </div>
  );
}
