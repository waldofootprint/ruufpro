"use client";

import { TABS, type TabId } from "@/lib/command-center";

export default function NavTabs({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
            active === tab.id
              ? "bg-white/10 text-white border border-white/10"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
