"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth-store";

export function AuthHydrator() {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleExpiredSession = () => {
      logout();
      router.replace("/login?sessionExpired=1");
    };

    window.addEventListener("ai-interview-auth-expired", handleExpiredSession);
    return () => window.removeEventListener("ai-interview-auth-expired", handleExpiredSession);
  }, [logout, router]);

  return null;
}
