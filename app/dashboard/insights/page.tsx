"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useDemoMode } from "@/lib/use-demo-mode";
import { DEMO_INSIGHTS } from "@/lib/demo-data";
import { ScoreboardSection } from "@/components/dashboard/insights/ScoreboardSection";
import { MoneyLeftSection } from "@/components/dashboard/insights/MoneyLeftSection";
import { HomeownersWantSection } from "@/components/dashboard/insights/HomeownersWantSection";
import { SpeedGameSection } from "@/components/dashboard/insights/SpeedGameSection";
import { RileyROISection } from "@/components/dashboard/insights/RileyROISection";
import { ReviewMomentumSection } from "@/components/dashboard/insights/ReviewMomentumSection";
import { CustomerDNASection } from "@/components/dashboard/insights/CustomerDNASection";
import { ModeBSection, type ModeBStats } from "@/components/dashboard/insights/ModeBSection";
import type {
  ScoreboardStats, MoneyLeftStats, HomeownersWantStats,
  SpeedGameStats, RileyROIStats, ReviewMomentumStats, CustomerDNAStats,
} from "@/lib/insights";

interface InsightsData {
  scoreboard: ScoreboardStats;
  moneyLeft: MoneyLeftStats;
  homeownersWant: HomeownersWantStats;
  speedGame: SpeedGameStats;
  rileyROI: RileyROIStats;
  reviewMomentum: ReviewMomentumStats;
  customerDNA: CustomerDNAStats;
}

export default function InsightsPage() {
  const { contractorId, businessName } = useDashboard();
  const isDemo = useDemoMode();
  const [data, setData] = useState<InsightsData | null>(isDemo ? (DEMO_INSIGHTS as InsightsData) : null);
  const [modeB, setModeB] = useState<ModeBStats | null>(null);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    if (!contractorId) return;
    (async () => {
      setLoading(true);
      try {
        const [insightsRes, modeBRes] = await Promise.all([
          fetch("/api/dashboard/insights", { cache: "no-store" }),
          fetch("/api/dashboard/insights/mode-b-rate", { cache: "no-store" }),
        ]);
        if (insightsRes.ok) setData(await insightsRes.json());
        if (modeBRes.ok) setModeB(await modeBRes.json());
      } catch (err) {
        console.error("Insights fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [contractorId, isDemo]);

  const firstName = businessName.split("'")[0].split(" ")[0] || "there";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-current/20 border-t-current"
          style={{ color: "var(--neu-accent)" }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[880px] mx-auto">
        <Heading firstName={firstName} />
        <div className="neu-flat p-8 text-center" style={{ borderRadius: 18 }}>
          <p className="text-sm neu-muted">Couldn&apos;t load insights. Try again in a moment.</p>
        </div>
      </div>
    );
  }

  const anyVisible =
    (data.scoreboard.closedThisWeekCount > 0 || data.scoreboard.pipelineCount > 0) ||
    data.moneyLeft.leads.length > 0 ||
    data.homeownersWant.totalConvos >= 3 ||
    data.speedGame.buckets.length > 0 ||
    data.rileyROI.state !== "hidden" ||
    data.reviewMomentum.totalSent > 0 || data.reviewMomentum.newThisMonth > 0 ||
    data.customerDNA.wonCount > 0;

  return (
    <div className="max-w-[920px] mx-auto space-y-6">
      <Heading firstName={firstName} />
      {!anyVisible ? (
        <div className="neu-flat p-8 text-center" style={{ borderRadius: 18 }}>
          <p className="text-sm neu-muted">No data yet. Insights light up as leads and reviews come in.</p>
        </div>
      ) : (
        <>
          <ScoreboardSection stats={data.scoreboard} />
          <MoneyLeftSection stats={data.moneyLeft} />
          <HomeownersWantSection stats={data.homeownersWant} />
          <SpeedGameSection stats={data.speedGame} />
          <RileyROISection stats={data.rileyROI} />
          <ReviewMomentumSection stats={data.reviewMomentum} />
          <CustomerDNASection stats={data.customerDNA} />
          {modeB && <ModeBSection stats={modeB} />}
        </>
      )}
    </div>
  );
}

function Heading({ firstName }: { firstName: string }) {
  return (
    <div className="relative">
      <span
        className="neu-glow-orange"
        style={{ width: 420, height: 220, top: -70, left: -100 }}
        aria-hidden
      />
      <div className="neu-eyebrow mb-3 relative z-[1]">Weekly Briefing</div>
      <h1
        className="font-bold mb-2 relative z-[1]"
        style={{ color: "var(--neu-text)", fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.04em" }}
      >
        Your <em className="neu-em">insights</em>, {firstName}.
      </h1>
      <p className="text-[15px] leading-relaxed relative z-[1]" style={{ color: "var(--neu-text-muted)" }}>
        What closed, what&apos;s waiting, what&apos;s working.
      </p>
    </div>
  );
}
