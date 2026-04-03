"use client";

import Link from "next/link";
import { Check, X, ExternalLink, Mail, Users, Globe, MessageSquare, Send, Search, FileText, ChevronRight } from "lucide-react";
import type { CommandAdvisor, CommandOutreach, CommandSiteCard, CommandProjectStatus } from "@/lib/command-center";
import { FEATURES } from "../feature/features-data";

interface ApprovalItem {
  id: string;
  type: "demo_site" | "email_draft" | "outreach_list" | "strategy" | "content" | "other";
  title: string;
  reasoning: string;
  previewUrl?: string;
  data?: Record<string, unknown>;
}

interface Props {
  advisorNote: CommandAdvisor | null;
  advisorBriefs: CommandAdvisor[];
  outreach: CommandOutreach[];
  siteCards: CommandSiteCard[];
  projectStatus: CommandProjectStatus[];
}

const TYPE_ICONS = {
  demo_site: Globe,
  email_draft: Mail,
  outreach_list: Users,
  strategy: FileText,
  content: MessageSquare,
  other: FileText,
};

const TYPE_LABELS = {
  demo_site: "Demo Site",
  email_draft: "Email Draft",
  outreach_list: "Outreach List",
  strategy: "Strategy",
  content: "Content",
  other: "Action",
};

export default function OverviewPanel({ advisorNote, advisorBriefs, outreach, siteCards, projectStatus }: Props) {

  // === APPROVAL QUEUE ===
  // In the future, these come from a dedicated approvals table.
  // For now, we derive them from existing data + advisor notes.
  const pendingApprovals: ApprovalItem[] = [];

  // Site cards in "review" status = awaiting approval
  siteCards
    .filter((c) => c.col === "review")
    .forEach((c) => {
      pendingApprovals.push({
        id: `site-${c.id}`,
        type: "demo_site",
        title: `${c.site_name} — ready for review`,
        reasoning: c.notes || `${c.template || "Site"} template build complete. Review and approve to mark done.`,
        previewUrl: c.site_url || undefined,
      });
    });

  // === PRODUCT STATUS ===
  // Hardcoded from actual codebase inventory (updated Apr 3, 2026)
  // Features: 12 complete, 3 planned, 2 in progress
  // Recent: Onboarding v3 shipped (magic generation + full edit mode + live preview)
  const totalFeatures = projectStatus.length > 0 ? projectStatus.length : 17;
  const completeFeatures = projectStatus.length > 0
    ? projectStatus.filter((p) => p.status === "complete").length
    : 12; // Estimate Widget V4, Lead Capture, SMS/10DLC, Review Automation, Push Notifications, Property Intel, Digital Signatures, Living Estimates, PDF Reports, Prospect Preview, Widget Embed, Contact Form
  const inProgressFeatures = projectStatus.length > 0
    ? projectStatus.filter((p) => p.status === "in_progress").length
    : 2; // Leads page, Command Center
  const plannedFeatures = projectStatus.length > 0
    ? projectStatus.filter((p) => p.status === "planned").length
    : 3; // SEO City Pages, GBP Sync, Stripe Billing
  const sitesLive = siteCards.filter((c) => c.col === "done").length;
  // 5 complete templates (Modern Clean, Chalkboard, Forge, Blueprint, Classic), Apex needs work
  const templatesComplete = projectStatus.length > 0
    ? projectStatus.filter((p) => p.category === "template" && p.status === "complete").length
    : 5;

  // === CHANNEL METRICS ===
  const demosSent = outreach.filter((o) => o.channel === "demo_site").length;
  const demosResponded = outreach.filter((o) => o.channel === "demo_site" && ["replied", "call_booked", "signed_up"].includes(o.status)).length;
  const coldEmailsSent = outreach.filter((o) => o.channel === "cold_email").length;
  const coldEmailsResponded = outreach.filter((o) => o.channel === "cold_email" && ["replied", "call_booked", "signed_up"].includes(o.status)).length;
  const facebookActivity = outreach.filter((o) => o.channel === "facebook").length;
  const facebookResponded = outreach.filter((o) => o.channel === "facebook" && ["replied", "call_booked", "signed_up"].includes(o.status)).length;
  const totalSignups = outreach.filter((o) => o.status === "signed_up").length;

  return (
    <div className="space-y-8">

      {/* ===== APPROVAL QUEUE ===== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${pendingApprovals.length > 0 ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {pendingApprovals.length > 0 ? `${pendingApprovals.length} Awaiting Your Approval` : "Nothing Waiting — All Clear"}
          </h3>
        </div>

        {pendingApprovals.length > 0 ? (
          <div className="space-y-3">
            {pendingApprovals.map((item) => {
              const Icon = TYPE_ICONS[item.type];
              return (
                <div key={item.id} className="bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/15 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-medium uppercase">{TYPE_LABELS[item.type]}</span>
                        </div>
                        <p className="text-[14px] text-white font-medium">{item.title}</p>
                        <p className="text-[12px] text-slate-400 mt-1">{item.reasoning}</p>
                        {item.previewUrl && (
                          <a
                            href={item.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-[11px] text-indigo-400 hover:text-indigo-300"
                          >
                            Preview <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium rounded-lg hover:bg-emerald-500/25 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-400 text-[11px] font-medium rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-3.5 h-3.5" /> Revise
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center">
            <p className="text-[13px] text-slate-400">I&apos;ll prepare demo sites, email drafts, and outreach lists for you to approve here.</p>
            <p className="text-[11px] text-slate-600 mt-1">When there&apos;s work ready, you&apos;ll see it with an Approve / Revise button.</p>
          </div>
        )}
      </div>

      {/* ===== ADVISOR NOTE ===== */}
      {advisorNote && (
        <div className="bg-gradient-to-br from-indigo-500/8 to-violet-500/4 border border-indigo-500/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <h4 className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold">Advisor&apos;s Note</h4>
          </div>
          <p className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">{advisorNote.content}</p>
          <p className="text-[10px] text-slate-600 mt-2">
            Updated {new Date(advisorNote.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      )}

      {/* ===== PRODUCT STATUS ===== */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Product Status</h3>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Features</p>
            <p className="text-xl font-bold text-emerald-400">{completeFeatures}<span className="text-sm text-slate-500">/{totalFeatures}</span></p>
            <p className="text-[11px] text-slate-500">{inProgressFeatures} in progress · {plannedFeatures} planned</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Templates</p>
            <p className="text-xl font-bold text-indigo-400">{templatesComplete}<span className="text-sm text-slate-500">/6</span></p>
            <p className="text-[11px] text-slate-500">complete · 1 needs work</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Roofer Sites</p>
            <p className="text-xl font-bold text-white">{sitesLive}</p>
            <p className="text-[11px] text-slate-500">live</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Signups</p>
            <p className="text-xl font-bold text-amber-400">{totalSignups}</p>
            <p className="text-[11px] text-slate-500">paying customers</p>
          </div>
        </div>

        {/* Clickable feature list */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
          {FEATURES.map((f) => {
            const statusColor = f.status === "complete" ? "bg-emerald-400" : f.status === "in_progress" ? "bg-amber-400" : "bg-blue-400";
            return (
              <Link
                key={f.slug}
                href={`/command-center/feature/${f.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full ${statusColor} shrink-0`} />
                <span className="text-[13px] text-white font-medium flex-1">{f.name}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  f.status === "complete" ? "bg-emerald-500/15 text-emerald-400"
                    : f.status === "in_progress" ? "bg-amber-500/15 text-amber-400"
                    : "bg-blue-500/15 text-blue-400"
                }`}>
                  {f.status === "complete" ? "Complete" : f.status === "in_progress" ? "In Progress" : "Planned"}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===== CHANNEL ACTIVITY ===== */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Channel Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Demo Sites */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-indigo-400" />
              <p className="text-[12px] text-white font-medium">Demo Site Submissions</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Sites built & sent</span>
                <span className="text-white font-medium">{demosSent}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Responses</span>
                <span className="text-emerald-400 font-medium">{demosResponded}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: demosSent > 0 ? `${(demosResponded / demosSent) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>

          {/* Cold Email */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-amber-400" />
              <p className="text-[12px] text-white font-medium">Cold Email</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Emails sent</span>
                <span className="text-white font-medium">{coldEmailsSent}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Responses</span>
                <span className="text-emerald-400 font-medium">{coldEmailsResponded}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: coldEmailsSent > 0 ? `${(coldEmailsResponded / coldEmailsSent) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <p className="text-[12px] text-white font-medium">Facebook Groups</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Engagements</span>
                <span className="text-white font-medium">{facebookActivity}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Responses</span>
                <span className="text-emerald-400 font-medium">{facebookResponded}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: facebookActivity > 0 ? `${(facebookResponded / facebookActivity) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RECENT BRIEFS ===== */}
      {advisorBriefs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Session Briefs</h3>
          <div className="space-y-2">
            {advisorBriefs.slice(0, 3).map((brief) => (
              <div key={brief.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">{brief.content}</p>
                <p className="text-[10px] text-slate-600 mt-2">
                  {new Date(brief.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== QUICK LINKS ===== */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Marketing Site", href: "/" },
            { label: "Demo", href: "/demo" },
            { label: "Vercel", href: "https://vercel.com/dashboard", ext: true },
            { label: "Supabase", href: "https://supabase.com/dashboard", ext: true },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.ext ? "_blank" : undefined}
              rel={link.ext ? "noopener noreferrer" : undefined}
              className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] text-slate-400 hover:text-white hover:border-white/10 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
