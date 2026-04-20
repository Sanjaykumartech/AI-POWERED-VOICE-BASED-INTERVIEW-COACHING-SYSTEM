"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Sidebar } from "./sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="lg:hidden">
          <button
            className="glass-card flex items-center gap-2 px-4 py-3 text-sm"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          {open ? <div className="mt-4"><Sidebar /></div> : null}
        </div>
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
