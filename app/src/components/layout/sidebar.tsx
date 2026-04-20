"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Home,
  History,
  Layers3,
  LogOut,
  Monitor,
  MessageSquareText,
  Settings2,
  UserCircle2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { cn, initials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/mock-interview", label: "Mock Interview", icon: MessageSquareText },
  { href: "/company-interview", label: "Company-Specific", icon: BriefcaseBusiness },
  { href: "/categories", label: "Categories", icon: Layers3 },
  { href: "/interview-history", label: "Interview History", icon: History },
  { href: "/progress", label: "Progress & Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserCircle2 }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"manage" | "logout" | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      setBusyAction("logout");
      await apiClient.request("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error(error);
    } finally {
      logout();
      router.push("/login");
      setBusyAction(null);
      setMenuOpen(false);
    }
  };

  const handleManageAccount = () => {
    setBusyAction("manage");
    router.push("/profile");
    setMenuOpen(false);
    window.setTimeout(() => setBusyAction(null), 150);
  };

  return (
    <aside className="glass-card panel-grid sticky top-6 flex h-[calc(100vh-3rem)] flex-col overflow-hidden p-5">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Premium SaaS</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">AI Interview Coach</h1>
          <p className="mt-2 text-sm text-slate-300">Sharpen answers, simulate pressure, and grow your readiness score.</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                    : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div ref={menuRef} className="relative mt-4 pt-2">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="w-full rounded-[28px] border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-semibold text-slate-950">
              {initials(user?.name ?? "AI")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name ?? "Guest"}</p>
              <p className="truncate text-xs text-slate-400">{user?.email ?? user?.targetRole ?? "Manage account"}</p>
            </div>
          </div>
        </button>

        {menuOpen ? (
          <div className="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-20 rounded-3xl border border-white/12 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <button
              type="button"
              onClick={handleManageAccount}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-200 transition hover:bg-white/8"
              disabled={busyAction !== null}
            >
              <Settings2 className="h-4 w-4" />
              Manage account
            </button>
            <div className="px-3 pb-2 text-xs text-slate-500">
              Devices, email, password, and session security
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-rose-200 transition hover:bg-rose-500/10"
              disabled={busyAction !== null}
            >
              <LogOut className="h-4 w-4" />
              {busyAction === "logout" ? "Logging out..." : "Logout"}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
