"use client";

import { ExternalLink } from "lucide-react";
import type { CommandProjectStatus, ProjectCategory } from "@/lib/command-center";
import { PROJECT_STATUS_CONFIG } from "@/lib/command-center";

interface Props {
  items: CommandProjectStatus[];
}

const CATEGORY_ORDER: ProjectCategory[] = ["page", "template", "feature", "api", "workflow", "research"];
const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  page: "Pages & Routes",
  template: "Templates",
  feature: "Features",
  api: "API Routes",
  workflow: "Workflows & SOPs",
  research: "Research & Strategy",
};

export default function ProjectStatusGrid({ items }: Props) {
  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((cat) => {
        const catItems = items.filter((i) => i.category === cat).sort((a, b) => a.sort_order - b.sort_order);
        if (catItems.length === 0) return null;

        const complete = catItems.filter((i) => i.status === "complete").length;

        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                {CATEGORY_LABELS[cat]}
              </h3>
              <span className="text-[11px] text-slate-600">
                {complete}/{catItems.length} complete
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {catItems.map((item) => {
                const sCfg = PROJECT_STATUS_CONFIG[item.status];
                return (
                  <div
                    key={item.id}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3.5 flex items-start justify-between gap-3 hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
                        <p className="text-[13px] text-white font-medium truncate">{item.feature_name}</p>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 ml-3.5 line-clamp-1">{item.description}</p>
                      )}
                      {item.route && (
                        <p className="text-[10px] text-slate-600 ml-3.5 mt-0.5 font-mono">{item.route}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${sCfg.color}`}>
                        {sCfg.label}
                      </span>
                      {item.route && (
                        <a
                          href={item.route}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
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
