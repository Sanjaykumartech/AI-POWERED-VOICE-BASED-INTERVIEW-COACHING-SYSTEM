"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

import { useAuthStore } from "@/store/auth-store";

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<OAuthCallbackShell />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const token = searchParams.get("token");
    const rawUser = searchParams.get("user");

    if (!token || !rawUser) {
      router.replace("/login?oauthError=invalid_callback");
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      setSession(token, user);
      router.replace(user?.requiresCandidateOnboarding ? "/onboarding" : "/dashboard");
    } catch {
      router.replace("/login?oauthError=invalid_user_payload");
    }
  }, [router, searchParams, setSession]);

  return <OAuthCallbackShell />;
}

function OAuthCallbackShell() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Google sign-in</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Signing you in...</h1>
        <p className="mt-3 text-sm text-slate-300">Please wait while your account session is prepared.</p>
      </div>
    </div>
  );
}
