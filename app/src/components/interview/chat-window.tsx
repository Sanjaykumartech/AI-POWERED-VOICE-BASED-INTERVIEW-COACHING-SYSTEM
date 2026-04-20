"use client";

import type { ReactNode } from "react";
import { Bot, User2 } from "lucide-react";

import { useInterviewStore } from "@/store/interview-store";
import { cn } from "@/lib/utils";

export function ChatWindow({
  footer,
  banner
}: {
  footer?: ReactNode;
  banner?: ReactNode;
}) {
  const messages = useInterviewStore((state) => state.messages);

  return (
    <div className="glass-card flex min-h-[520px] flex-col p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Interview Conversation</h3>
          <p className="text-sm text-slate-400">ChatGPT-style interview flow with evaluation checkpoints.</p>
        </div>
      </div>

      {banner ? <div className="mb-4">{banner}</div> : null}

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role === "assistant" ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-200">
                <Bot className="h-4 w-4" />
              </div>
            ) : null}
            <div
              className={cn(
                "max-w-[80%] rounded-3xl px-4 py-3 text-sm",
                message.role === "user"
                  ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white"
                  : "border border-white/10 bg-white/5 text-slate-100",
              )}
            >
              <p>{message.text}</p>
              {message.meta ? <p className="mt-2 text-xs text-slate-300">{message.meta}</p> : null}
            </div>
            {message.role === "user" ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-400/20 text-violet-200">
                <User2 className="h-4 w-4" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {footer ? <div className="mt-5 border-t border-white/10 pt-5">{footer}</div> : null}
    </div>
  );
}
