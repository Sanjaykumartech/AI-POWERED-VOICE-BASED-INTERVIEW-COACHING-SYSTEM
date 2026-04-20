"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuthStore } from "@/store/auth-store";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
      return;
    }

    if (hydrated && token && user?.requiresCandidateOnboarding) {
      router.replace("/onboarding");
    }
  }, [hydrated, router, token, user?.requiresCandidateOnboarding]);

  return (
    <>
      <AuthHydrator />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
