"use client";

import { useState, useRef } from "react";
import { Send, Upload, FileText, MessageSquare, Image, ChevronDown, ChevronUp } from "lucide-react";
import type { CommandInboxItem } from "@/lib/command-center";
import { INBOX_STATUS_CONFIG } from "@/lib/command-center";

interface Props {
  items: CommandInboxItem[];
  onSubmit: (item: Partial<CommandInboxItem>) => void;
}

const TYPE_ICONS = {
  text: MessageSquare,
  file: FileText,
  transcript: FileText,
  note: MessageSquare,
  screenshot: Image,
};

const TYPE_OPTIONS: { value: CommandInboxItem["type"]; label: string }[] = [
  { value: "text", label: "Text / Paste" },
  { value: "transcript", label: "Transcript" },
  { value: "note", label: "My Notes / Ideas" },
  { value: "file", label: "File" },
  { value: "screenshot", label: "Screenshot" },
];

export default function InboxPanel({ items, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommandInboxItem["type"]>("text");
  const [fileName, setFileName] = useState("");
  const [showProcessed, setShowProcessed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const newItems = items.filter((i) => i.status === "new");
  const processingItems = items.filter((i) => i.status === "processing");
  const processedItems = items.filter((i) => i.status === "processed" || i.status === "filed");

  function handleSubmit() {
    if (!content.trim() && !fileName.trim()) return;
    onSubmit({
      type,
      title: title.trim() || null,
      content: content.trim() || null,
      file_name: fileName.trim() || null,
      status: "new",
    });
    setTitle("");
    setContent("");
    setFileName("");
    setType("text");
    if (textareaRef.current) textareaRef.current.focus();
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setType("file");
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt") || file.name.endsWith(".vtt")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setContent(ev.target?.result as string || "");
          if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
        };
        reader.readAsText(file);
      } else {
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
        setContent(`[File: ${file.name}, ${(file.size / 1024).toFixed(1)}KB, type: ${file.type}]`);
      }
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setType("file");
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt") || file.name.endsWith(".vtt")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setContent(ev.target?.result as string || "");
          if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
        };
        reader.readAsText(file);
      } else {
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
        setContent(`[File: ${file.name}, ${(file.size / 1024).toFixed(1)}KB, type: ${file.type}]`);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop zone + input */}
      <div
        className="bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl p-6 transition-colors hover:border-indigo-500/30"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-4 h-4 text-indigo-400" />
          <h3 className="text-[14px] text-white font-semibold">Drop something in</h3>
          <span className="text-[11px] text-slate-500">Drag a file here or type below</span>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-3">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                type === opt.value
                  ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                  : "text-slate-500 border-white/5 hover:border-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <input
          type="text"
          placeholder="Title (optional — I'll figure it out if blank)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 mb-3"
        />

        {/* Content area */}
        <textarea
          ref={textareaRef}
          placeholder="Paste a transcript, type your thoughts, drop a link, dump raw notes... I'll sort it out."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 resize-y font-mono leading-relaxed"
        />

        {/* File info + actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[12px] text-slate-400 hover:text-white hover:border-white/15 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Upload file
              <input type="file" className="hidden" onChange={handleFileSelect} />
            </label>
            {fileName && (
              <span className="text-[11px] text-slate-500">{fileName}</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && !fileName.trim()}
            className="px-4 py-2 bg-indigo-500 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Drop in Inbox
          </button>
        </div>
      </div>

      {/* Pending items */}
      {(newItems.length > 0 || processingItems.length > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Waiting to be Processed ({newItems.length + processingItems.length})
          </h3>
          <div className="space-y-2">
            {[...processingItems, ...newItems].map((item) => {
              const Icon = TYPE_ICONS[item.type];
              const sCfg = INBOX_STATUS_CONFIG[item.status];
              return (
                <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
                  <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] text-white font-medium truncate">{item.title || "Untitled"}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${sCfg.color}`}>{sCfg.label}</span>
                    </div>
                    {item.content && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.content.slice(0, 200)}</p>
                    )}
                    {item.file_name && (
                      <p className="text-[10px] text-slate-600 mt-1 font-mono">{item.file_name}</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-1">
                      {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Processed items */}
      {processedItems.length > 0 && (
        <div>
          <button
            onClick={() => setShowProcessed(!showProcessed)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
          >
            Processed ({processedItems.length})
            {showProcessed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showProcessed && (
            <div className="space-y-2">
              {processedItems.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                return (
                  <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white font-medium">{item.title || "Untitled"}</p>
                        {item.processed_summary && (
                          <p className="text-[12px] text-slate-300 mt-1.5 leading-relaxed">{item.processed_summary}</p>
                        )}
                        {item.filed_location && (
                          <p className="text-[10px] text-indigo-400 mt-1">Filed → {item.filed_location}</p>
                        )}
                        <p className="text-[10px] text-slate-600 mt-1">
                          Processed {item.processed_at ? new Date(item.processed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center">
          <p className="text-[14px] text-slate-400 mb-1">Your inbox is empty</p>
          <p className="text-[12px] text-slate-600">Drop a transcript, paste your notes, upload a file — I&apos;ll process it next time we talk.</p>
        </div>
      )}
    </div>
  );
}
