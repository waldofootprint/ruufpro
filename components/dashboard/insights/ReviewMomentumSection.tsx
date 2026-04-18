"use client";

import { Star } from "lucide-react";
import type { ReviewMomentumStats } from "@/lib/insights";
import { SectionShell, InsetStat } from "./SectionShell";

export function ReviewMomentumSection({ stats }: { stats: ReviewMomentumStats }) {
  if (stats.totalSent === 0 && stats.newThisMonth === 0) return null;

  const parts: string[] = [];
  if (stats.newThisMonth > 0) {
    parts.push(`You picked up ${stats.newThisMonth} new Google ${stats.newThisMonth === 1 ? "review" : "reviews"} this month.`);
  }
  if (stats.recentReviewed.length > 0) {
    const firstName = stats.recentReviewed[0].leadName.split(" ")[0];
    parts.push(`${firstName} left one ${stats.recentReviewed[0].sentAgo}.`);
  }
  if (stats.unrequestedCompleted > 0) {
    parts.push(`You have ${stats.unrequestedCompleted} completed ${stats.unrequestedCompleted === 1 ? "job" : "jobs"} who haven't been asked yet.`);
  }

  return (
    <SectionShell icon={Star} title="Review Momentum" caption="Google reviews · this month">
      {parts.length > 0 && (
        <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{parts.join(" ")}</p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <InsetStat label="New this month" value={`+${stats.newThisMonth}`} sub={`${stats.totalReviewed} all-time`} />
        <InsetStat label="Requests sent" value={String(stats.totalSent)} sub={`${stats.clickRatePct}% clicked`} />
        <InsetStat label="Reviewed" value={String(stats.totalReviewed)} sub={`${stats.reviewRatePct}% of sent`} />
        <InsetStat label="Unrequested" value={String(stats.unrequestedCompleted)} sub="Completed jobs" />
      </div>
      {stats.unrequestedCompleted > 0 && (
        <a
          href="/dashboard/settings?tab=reviews"
          className="inline-block text-[12px] font-bold px-4 py-2"
          style={{
            borderRadius: 10,
            background: "var(--neu-accent)",
            color: "var(--neu-accent-fg)",
            boxShadow: "3px 3px 8px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)",
          }}
        >
          Send Review Requests
        </a>
      )}
    </SectionShell>
  );
}
