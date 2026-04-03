"use client";

export default function MrrProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">${current.toLocaleString()}</span>
          <span className="text-sm text-slate-500">MRR</span>
        </div>
        <span className="text-sm text-slate-500">${target.toLocaleString()} goal</span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-slate-600">Pre-Launch</span>
        <span className="text-[11px] text-slate-600">{pct}%</span>
      </div>
    </div>
  );
}
