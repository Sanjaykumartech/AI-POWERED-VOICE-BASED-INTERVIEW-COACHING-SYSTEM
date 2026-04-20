"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:scale-[1.01] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

