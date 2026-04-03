"use client";

import type { CommandPlay, CommandOutreach, PlayStep } from "@/lib/command-center";

interface Props {
  plays: CommandPlay[];
  outreach: CommandOutreach[];
}

export default function StatCards({ plays, outreach }: Props) {
  const activePlays = plays.filter((p) => p.category === "active");
  const completedPlays = plays.filter((p) => p.status === "done");

  // Steps completed this week
  const allSteps = plays.flatMap((p) => (p.steps as PlayStep[]) || []);
  const doneSteps = allSteps.filter((s) => s.done);

  // Pipeline
  const demosSent = outreach.filter((o) => o.channel === "demo_site").length;
  const responses = outreach.filter((o) =>
    ["replied", "call_booked", "signed_up"].includes(o.status)
  ).length;
  const signups = outreach.filter((o) => o.status === "signed_up").length;

  const stats = [
    {
      label: "Plays",
      value: `${completedPlays.length}/${plays.length}`,
      sub: `${activePlays.length} active`,
      accent: "text-indigo-400",
    },
    {
      label: "Steps Done",
      value: `${doneSteps.length}/${allSteps.length}`,
      sub: `${allSteps.length > 0 ? Math.round((doneSteps.length / allSteps.length) * 100) : 0}% complete`,
      accent: "text-amber-400",
    },
    {
      label: "Pipeline",
      value: `${demosSent}`,
      sub: `${responses} replies · ${signups} signups`,
      accent: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
        >
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
          <p className={`text-xl font-bold ${s.accent}`}>{s.value}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
