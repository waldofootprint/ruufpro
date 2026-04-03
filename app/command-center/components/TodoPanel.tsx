"use client";

import { useState } from "react";
import { Star, Plus, Check, Circle, Loader2, Trash2 } from "lucide-react";
import type { CommandTodo } from "@/lib/command-center";

interface Props {
  todos: CommandTodo[];
  onAdd: (title: string, description: string, source: string) => void;
  onToggleStatus: (id: string, status: CommandTodo["status"]) => void;
  onToggleShortlist: (id: string, isShortlist: boolean, rank: number | null) => void;
  onDelete: (id: string) => void;
}

const STATUS_ICONS = {
  pending: Circle,
  in_progress: Loader2,
  done: Check,
};

const STATUS_STYLES = {
  pending: "text-slate-500 hover:text-white",
  in_progress: "text-amber-400",
  done: "text-emerald-400",
};

export default function TodoPanel({ todos, onAdd, onToggleStatus, onToggleShortlist, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [source, setSource] = useState("");

  const shortlist = todos
    .filter((t) => t.is_shortlist && t.status !== "done")
    .sort((a, b) => (a.shortlist_rank || 99) - (b.shortlist_rank || 99))
    .slice(0, 5);

  const masterPending = todos.filter((t) => t.status !== "done");
  const masterDone = todos.filter((t) => t.status === "done");

  function handleAdd() {
    if (!title.trim()) return;
    onAdd(title, desc, source);
    setTitle("");
    setDesc("");
    setSource("");
    setShowAdd(false);
  }

  function cycleStatus(todo: CommandTodo) {
    const next = todo.status === "pending" ? "in_progress" : todo.status === "in_progress" ? "done" : "pending";
    onToggleStatus(todo.id, next);
  }

  function renderTodo(todo: CommandTodo, showShortlistToggle = true) {
    const Icon = STATUS_ICONS[todo.status];
    const style = STATUS_STYLES[todo.status];

    return (
      <div
        key={todo.id}
        className={`flex items-start gap-3 p-3 rounded-lg group transition-colors ${
          todo.status === "done" ? "opacity-50" : "hover:bg-white/[0.02]"
        }`}
      >
        <button
          onClick={() => cycleStatus(todo)}
          className={`mt-0.5 transition-colors ${style}`}
        >
          <Icon className={`w-4 h-4 ${todo.status === "in_progress" ? "animate-spin" : ""}`} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium ${todo.status === "done" ? "text-slate-600 line-through" : "text-white"}`}>
            {todo.title}
          </p>
          {todo.description && (
            <p className="text-[11px] text-slate-500 mt-0.5">{todo.description}</p>
          )}
          {todo.source && (
            <p className="text-[10px] text-slate-600 mt-0.5">Source: {todo.source}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showShortlistToggle && (
            <button
              onClick={() => onToggleShortlist(todo.id, !todo.is_shortlist, todo.is_shortlist ? null : (shortlist.length + 1))}
              className={`p-1 rounded transition-colors ${
                todo.is_shortlist ? "text-amber-400" : "text-slate-600 hover:text-amber-400"
              }`}
              title={todo.is_shortlist ? "Remove from Top 5" : "Add to Top 5"}
            >
              <Star className="w-3.5 h-3.5" fill={todo.is_shortlist ? "currentColor" : "none"} />
            </button>
          )}
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 5 Shortlist */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
          <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Top 5 — Move the Needle</h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">These are what I recommend you focus on right now. Star any item from the master list to add it here.</p>

        {shortlist.length > 0 ? (
          <div className="bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/15 rounded-xl overflow-hidden">
            {shortlist.map((todo, i) => (
              <div key={todo.id} className="border-b border-white/[0.04] last:border-0">
                <div className="flex items-start gap-3 p-4">
                  <span className="text-amber-400 font-bold text-sm mt-0.5 w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white font-medium">{todo.title}</p>
                    {todo.description && <p className="text-[11px] text-slate-500 mt-0.5">{todo.description}</p>}
                    {todo.source && <p className="text-[10px] text-slate-600 mt-0.5">Source: {todo.source}</p>}
                  </div>
                  <button
                    onClick={() => cycleStatus(todo)}
                    className={`transition-colors ${STATUS_STYLES[todo.status]}`}
                  >
                    {(() => { const I = STATUS_ICONS[todo.status]; return <I className={`w-4 h-4 ${todo.status === "in_progress" ? "animate-spin" : ""}`} />; })()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm">Star items from the master list below to build your Top 5.</p>
          </div>
        )}
      </div>

      {/* Master List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Master To-Do List</h3>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-600">{masterPending.length} pending · {masterDone.length} done</span>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-white/[0.03] border border-indigo-500/20 rounded-xl p-4 mb-3 space-y-3">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
              autoFocus
            />
            <input
              type="text"
              placeholder="Details (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            />
            <input
              type="text"
              placeholder="Source — vault entry, conversation, etc (optional)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-500 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
          {masterPending.map((todo) => renderTodo(todo))}
          {masterPending.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-slate-500 text-sm">No pending items. Click + to add one.</p>
            </div>
          )}
        </div>

        {/* Completed */}
        {masterDone.length > 0 && (
          <details className="mt-4">
            <summary className="text-[12px] text-slate-600 cursor-pointer hover:text-slate-400">
              {masterDone.length} completed items
            </summary>
            <div className="mt-2 bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden divide-y divide-white/[0.03]">
              {masterDone.map((todo) => renderTodo(todo, false))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
