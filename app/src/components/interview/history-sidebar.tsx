"use client";

import { PanelLeftClose, Play } from "lucide-react";

import { cn } from "@/lib/utils";

interface InterviewHistoryItem {
  id: string;
  role: string;
  mode: "mock" | "company";
  company?: string;
  topics: string[];
  category: "technical" | "management" | "general";
  status: "active" | "paused" | "completed";
  startedAt: string;
  updatedAt: string;
  endedAt?: string;
  averageScore: number;
  interactionCount: number;
  preview: string;
  resumable: boolean;
}

export function InterviewHistorySidebar({
  open,
  sessions,
  selectedSessionId,
  loading,
  onToggle,
  onSelect
}: {
  open: boolean;
  sessions: InterviewHistoryItem[];
  selectedSessionId?: string;
  loading?: boolean;
  onToggle: () => void;
  onSelect: (session: InterviewHistoryItem) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <aside
      className={cn(
        "glass-card z-20 flex h-full min-h-[640px] flex-col overflow-hidden transition-all duration-200",
        "fixed inset-y-6 left-4 right-4 lg:static lg:w-[320px]"
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Interview History</h3>
          <p className="text-xs text-slate-400">All saved and completed sessions</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Loading conversation history...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            No interview sessions yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelect(session)}
                className={cn(
                  "w-full rounded-2xl border px-3 py-3 text-left transition",
                  selectedSessionId === session.id
                    ? "border-cyan-300/30 bg-cyan-300/10"
                    : "border-white/10 bg-white/5 hover:bg-white/8"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {session.company ? `${session.company} · ${session.role}` : session.role}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {session.preview}
                    </p>
                  </div>
                  {session.resumable ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
                      <Play className="h-3 w-3" />
                      Continue
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/8 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Ended
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                  <span>{session.interactionCount} turns</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
