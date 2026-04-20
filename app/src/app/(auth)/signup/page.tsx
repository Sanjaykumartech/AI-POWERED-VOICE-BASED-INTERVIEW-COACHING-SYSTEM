import Link from "next/link";
import { Suspense } from "react";

import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthHydrator />
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/70">Career acceleration</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight text-white">
            Build a personal interview memory system that grows with every answer.
          </h1>
          <p className="mt-5 text-lg text-slate-300">
            Sign up once and unlock role-based practice, company-style rounds, topic analytics, and long-term progress tracking.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-200 hover:text-cyan-100">
              Log in
            </Link>
          </p>
        </div>
        <Suspense fallback={<div className="glass-card h-[460px] w-full max-w-md animate-pulse p-8" />}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
