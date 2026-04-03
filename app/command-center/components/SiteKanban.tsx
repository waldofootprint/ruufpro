"use client";

import { useState, type DragEvent } from "react";
import { ExternalLink, Plus, GripVertical } from "lucide-react";
import type { CommandSiteCard, KanbanCol, SitePriority } from "@/lib/command-center";
import { KANBAN_COLUMNS, PRIORITY_CONFIG, TEMPLATE_OPTIONS } from "@/lib/command-center";
import SiteCardForm from "./SiteCardForm";

interface Props {
  cards: CommandSiteCard[];
  onAddCard: (data: { site_name: string; city: string; template: string; edit_request: string; priority: SitePriority }) => void;
  onMoveCard: (id: string, col: KanbanCol) => void;
}

export default function SiteKanban({ cards, onAddCard, onMoveCard }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanCol | null>(null);

  function handleDragStart(e: DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    // Make ghost slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e: DragEvent, col: KanbanCol) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  function handleDrop(e: DragEvent, col: KanbanCol) {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedId) {
      onMoveCard(draggedId, col);
      setDraggedId(null);
    }
  }

  function handleAddCard(data: { site_name: string; city: string; template: string; edit_request: string; priority: SitePriority }) {
    onAddCard(data);
    setShowForm(false);
  }

  const templateLabel = (val: string | null) => TEMPLATE_OPTIONS.find((t) => t.value === val)?.label || val || "—";

  return (
    <div className="space-y-4">
      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">

        {/* Templates column (static) */}
        <div className="min-w-[220px] w-[220px] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Templates</h4>
            <span className="text-[11px] text-slate-600">{TEMPLATE_OPTIONS.length}</span>
          </div>
          <div className="space-y-2">
            {TEMPLATE_OPTIONS.map((tmpl) => (
              <div
                key={tmpl.value}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 flex items-center justify-between"
              >
                <span className="text-[13px] text-white font-medium">{tmpl.label}</span>
                {tmpl.route && (
                  <a
                    href={tmpl.route}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic columns */}
        {KANBAN_COLUMNS.map((column) => {
          const colCards = cards.filter((c) => c.col === column.id);
          const isOver = dragOverCol === column.id;

          return (
            <div
              key={column.id}
              className="min-w-[240px] w-[240px] shrink-0"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">{column.label}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600">{colCards.length}</span>
                  {column.id === "edit_requested" && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`min-h-[200px] rounded-xl border-2 border-dashed transition-colors p-2 space-y-2 ${
                  isOver
                    ? `${column.color} bg-white/[0.02]`
                    : "border-transparent"
                }`}
              >
                {colCards.map((card) => {
                  const priCfg = PRIORITY_CONFIG[card.priority];
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-white/15 transition-all ${
                        draggedId === card.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[13px] text-white font-medium truncate">{card.site_name}</p>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${priCfg.color}`}>
                              {priCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            {card.template && (
                              <span className="text-[10px] bg-indigo-500/12 text-indigo-400 px-1.5 py-0.5 rounded">
                                {templateLabel(card.template)}
                              </span>
                            )}
                            {card.city && (
                              <span className="text-[10px] text-slate-500">{card.city}</span>
                            )}
                          </div>
                          {card.edit_request && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{card.edit_request}</p>
                          )}
                          {card.site_url && (
                            <a
                              href={card.site_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View site <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {card.notes && (
                            <p className="text-[10px] text-slate-600 mt-1 italic">{card.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colCards.length === 0 && (
                  <div className="flex items-center justify-center h-[100px] text-[11px] text-slate-600">
                    {column.id === "edit_requested" ? "Click + to add a site" : "Drag cards here"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add card modal */}
      {showForm && (
        <SiteCardForm
          onSubmit={handleAddCard}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
