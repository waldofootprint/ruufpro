"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type {
  CommandPlay,
  CommandPositioning,
  CommandMotivation,
  CommandAdvisor,
  CommandOutreach,
  CommandWin,
  CommandProjectStatus,
  CommandSiteCard,
  CommandTodo,
  CommandInboxItem,
  TabId,
  OutreachStatus,
  KanbanCol,
  SitePriority,
} from "@/lib/command-center";

import NavTabs from "./components/NavTabs";
import MrrProgressBar from "./components/MrrProgressBar";
import OverviewPanel from "./components/OverviewPanel";
import PlayCard from "./components/PlayCard";
import SiteKanban from "./components/SiteKanban";
import PositioningPanel from "./components/PositioningPanel";
import MotivationPanel from "./components/MotivationPanel";
import OutreachPanel from "./components/OutreachPanel";
import ProjectStatusGrid from "./components/ProjectStatusGrid";
import ResearchLinks from "./components/ResearchLinks";
import VaultLessons from "./components/VaultLessons";
import TodoPanel from "./components/TodoPanel";
import InboxPanel from "./components/InboxPanel";
import OnboardingPanel from "./components/OnboardingPanel";

export default function CommandCenterPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => {
    const paramTab = searchParams.get("tab");
    const validTabs: TabId[] = ["overview", "onboarding", "inbox", "todos", "plays", "sites", "outreach", "vault", "project", "research", "positioning", "motivation"];
    return paramTab && validTabs.includes(paramTab as TabId) ? (paramTab as TabId) : "overview";
  });
  const [plays, setPlays] = useState<CommandPlay[]>([]);
  const [positioning, setPositioning] = useState<CommandPositioning | null>(null);
  const [motivation, setMotivation] = useState<CommandMotivation[]>([]);
  const [advisor, setAdvisor] = useState<CommandAdvisor[]>([]);
  const [outreach, setOutreach] = useState<CommandOutreach[]>([]);
  const [wins, setWins] = useState<CommandWin[]>([]);
  const [projectStatus, setProjectStatus] = useState<CommandProjectStatus[]>([]);
  const [siteCards, setSiteCards] = useState<CommandSiteCard[]>([]);
  const [todos, setTodos] = useState<CommandTodo[]>([]);
  const [inbox, setInbox] = useState<CommandInboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [playsRes, posRes, advRes, outRes, winsRes, projRes, sitesRes, todosRes, inboxRes] = await Promise.all([
        fetch("/api/command-center/plays"),
        fetch("/api/command-center/positioning"),
        fetch("/api/command-center/advisor"),
        fetch("/api/command-center/outreach"),
        fetch("/api/command-center/wins"),
        fetch("/api/command-center/project-status"),
        fetch("/api/command-center/sites"),
        fetch("/api/command-center/todos"),
        fetch("/api/command-center/inbox"),
      ]);

      const [playsData, posData, advData, outData, winsData, projData, sitesData, todosData, inboxData] = await Promise.all([
        playsRes.ok ? playsRes.json() : [],
        posRes.ok ? posRes.json() : null,
        advRes.ok ? advRes.json() : [],
        outRes.ok ? outRes.json() : [],
        winsRes.ok ? winsRes.json() : [],
        projRes.ok ? projRes.json() : [],
        sitesRes.ok ? sitesRes.json() : [],
        todosRes.ok ? todosRes.json() : [],
        inboxRes.ok ? inboxRes.json() : [],
      ]);

      setPlays(Array.isArray(playsData) ? playsData : []);
      setPositioning(posData && !posData.error ? posData : null);
      setAdvisor(Array.isArray(advData) ? advData : []);
      setOutreach(Array.isArray(outData) ? outData : []);
      setWins(Array.isArray(winsData) ? winsData : []);
      setProjectStatus(Array.isArray(projData) ? projData : []);
      setSiteCards(Array.isArray(sitesData) ? sitesData : []);
      setTodos(Array.isArray(todosData) ? todosData : []);
      setInbox(Array.isArray(inboxData) ? inboxData : []);
    } catch (err) {
      console.error("Failed to fetch command center data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch motivation from supabase directly (no dedicated API route needed — uses RLS)
  useEffect(() => {
    async function fetchMotivation() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase
          .from("command_motivation")
          .select("*")
          .order("sort_order", { ascending: true });
        if (data) setMotivation(data);
      } catch {}
    }
    fetchMotivation();
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Action handlers ---

  async function handlePlayStatusChange(id: string, status: CommandPlay["status"]) {
    setPlays((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    await fetch("/api/command-center/plays", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function handleStepToggle(playId: string, stepIndex: number, done: boolean) {
    setPlays((prev) =>
      prev.map((p) => {
        if (p.id !== playId) return p;
        const steps = [...(p.steps || [])];
        steps[stepIndex] = { ...steps[stepIndex], done };
        return { ...p, steps };
      })
    );
    await fetch("/api/command-center/steps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playId, stepIndex, done }),
    });
  }

  async function handleAddOutreach(item: Partial<CommandOutreach>) {
    const res = await fetch("/api/command-center/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const newItem = await res.json();
      setOutreach((prev) => [newItem, ...prev]);
    }
  }

  async function handleOutreachStatusChange(id: string, status: OutreachStatus) {
    setOutreach((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch("/api/command-center/outreach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function handleAddWin(title: string, description: string, milestone_type: CommandWin["milestone_type"]) {
    const res = await fetch("/api/command-center/wins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, milestone_type }),
    });
    if (res.ok) {
      const newWin = await res.json();
      setWins((prev) => [newWin, ...prev]);
    }
  }

  async function handleAddTodo(title: string, description: string, source: string) {
    const res = await fetch("/api/command-center/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || null, source: source || null }),
    });
    if (res.ok) {
      const newTodo = await res.json();
      setTodos((prev) => [...prev, newTodo]);
    }
  }

  async function handleToggleTodoStatus(id: string, status: CommandTodo["status"]) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch("/api/command-center/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function handleToggleShortlist(id: string, is_shortlist: boolean, shortlist_rank: number | null) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, is_shortlist, shortlist_rank } : t)));
    await fetch("/api/command-center/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_shortlist, shortlist_rank }),
    });
  }

  async function handleDeleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch("/api/command-center/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function handleInboxSubmit(item: Partial<CommandInboxItem>) {
    const res = await fetch("/api/command-center/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const newItem = await res.json();
      setInbox((prev) => [newItem, ...prev]);
    }
  }

  async function handleAddSiteCard(data: { site_name: string; city: string; template: string; edit_request: string; priority: SitePriority }) {
    const res = await fetch("/api/command-center/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, col: "edit_requested" }),
    });
    if (res.ok) {
      const newCard = await res.json();
      setSiteCards((prev) => [newCard, ...prev]);
    }
  }

  async function handleMoveSiteCard(id: string, col: KanbanCol) {
    setSiteCards((prev) => prev.map((c) => (c.id === id ? { ...c, col } : c)));
    await fetch("/api/command-center/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, col }),
    });
  }

  // --- Derived data ---
  const advisorNote = advisor.find((a) => a.type === "note") || null;
  const advisorBriefs = advisor.filter((a) => a.type === "brief");
  const activePlays = plays.filter((p) => p.category === "active");
  const queuedPlays = plays.filter((p) => p.category === "queued" || p.status === "queued");

  // Next action: first in-progress play, or first not-started active play

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <a href="/mission-control" className="text-xs text-slate-600 hover:text-slate-400 no-underline flex items-center gap-1 mb-3">
          <span className="text-sm">&larr;</span> Mission Control
        </a>
        <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
        <p className="text-sm text-slate-500 mt-1">Pre-Launch → $50K MRR</p>
        <div className="mt-4">
          <MrrProgressBar current={positioning?.mrr_current || 0} target={positioning?.mrr_target || 50000} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-white/[0.06] pb-3">
        <NavTabs active={tab} onChange={setTab} />
      </div>

      {/* Tab content */}
      <div className="min-h-[50vh]">
        {/* OVERVIEW */}
        {tab === "overview" && (
          <OverviewPanel
            advisorNote={advisorNote}
            advisorBriefs={advisorBriefs}
            outreach={outreach}
            siteCards={siteCards}
            projectStatus={projectStatus}
          />
        )}

        {/* ONBOARDING */}
        {tab === "onboarding" && (
          <OnboardingPanel />
        )}

        {/* INBOX */}
        {tab === "inbox" && (
          <InboxPanel items={inbox} onSubmit={handleInboxSubmit} />
        )}

        {/* TO-DO */}
        {tab === "todos" && (
          <TodoPanel
            todos={todos}
            onAdd={handleAddTodo}
            onToggleStatus={handleToggleTodoStatus}
            onToggleShortlist={handleToggleShortlist}
            onDelete={handleDeleteTodo}
          />
        )}

        {/* PLAYS */}
        {tab === "plays" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Active Plays</h3>
              <div className="space-y-3">
                {activePlays.map((play) => (
                  <PlayCard
                    key={play.id}
                    play={play}
                    onStatusChange={handlePlayStatusChange}
                    onStepToggle={handleStepToggle}
                  />
                ))}
                {activePlays.length === 0 && (
                  <p className="text-slate-500 text-sm">No active plays yet.</p>
                )}
              </div>
            </div>

            {queuedPlays.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Queued</h3>
                <div className="space-y-3">
                  {queuedPlays.map((play) => (
                    <PlayCard
                      key={play.id}
                      play={play}
                      onStatusChange={handlePlayStatusChange}
                      onStepToggle={handleStepToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SITES */}
        {tab === "sites" && (
          <SiteKanban
            cards={siteCards}
            onAddCard={handleAddSiteCard}
            onMoveCard={handleMoveSiteCard}
          />
        )}

        {/* OUTREACH */}
        {tab === "outreach" && (
          <OutreachPanel
            outreach={outreach}
            onAdd={handleAddOutreach}
            onStatusChange={handleOutreachStatusChange}
          />
        )}

        {/* VAULT LESSONS */}
        {tab === "vault" && (
          <VaultLessons />
        )}

        {/* PROJECT STATUS */}
        {tab === "project" && (
          <ProjectStatusGrid items={projectStatus} />
        )}

        {/* RESEARCH */}
        {tab === "research" && (
          <ResearchLinks />
        )}

        {/* POSITIONING */}
        {tab === "positioning" && (
          <PositioningPanel pos={positioning} />
        )}

        {/* MOTIVATION */}
        {tab === "motivation" && (
          <MotivationPanel
            motivation={motivation}
            wins={wins}
            onAddWin={handleAddWin}
          />
        )}
      </div>
    </div>
  );
}
