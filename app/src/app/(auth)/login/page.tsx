import Link from "next/link";
import { Suspense } from "react";

import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthHydrator />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.25),transparent_35%)]" />
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/70">AI Interview Coach</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight text-white">
            Premium interview practice that remembers how you improve.
          </h1>
          <p className="mt-5 text-lg text-slate-300">
            Launch mock interviews, track topic mastery, review weak areas, and receive AI coaching tuned to your target role.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            New here?{" "}
            <Link href="/signup" className="text-cyan-200 hover:text-cyan-100">
              Create your account
            </Link>
          </p>
        </div>
        <Suspense fallback={<div className="glass-card h-[420px] w-full max-w-md animate-pulse p-8" />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
