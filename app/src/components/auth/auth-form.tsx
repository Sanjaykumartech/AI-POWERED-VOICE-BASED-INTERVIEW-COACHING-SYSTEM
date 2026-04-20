"use client";

import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { API_ORIGIN, apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    targetRole: "Frontend Engineer"
  });
  const oauthError = searchParams.get("oauthError");
  const sessionExpired = searchParams.get("sessionExpired");

  useEffect(() => {
    if (hydrated && token && user) {
      router.replace(user.requiresCandidateOnboarding ? "/onboarding" : "/dashboard");
    }
  }, [hydrated, router, token, user]);

  const continueWithGoogle = () => {
    window.location.href = `${API_ORIGIN}/api/auth/google`;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      const normalized = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        targetRole: form.targetRole.trim()
      };

      if (mode === "signup") {
        if (!normalized.name) {
          throw new Error("Full name is required");
        }

        if (normalized.password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }

        if (!normalized.targetRole) {
          throw new Error("Target role is required");
        }
      }

      if (!normalized.email) {
        throw new Error("Email address is required");
      }

      if (!normalized.password) {
        throw new Error("Password is required");
      }

      const path = mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload =
        mode === "signup"
          ? normalized
          : { email: normalized.email, password: normalized.password };
      const response = await apiClient.request<{ token: string; user: any }>(path, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession(response.token, response.user);
      router.replace(response.user?.requiresCandidateOnboarding ? "/onboarding" : "/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="glass-card w-full max-w-md space-y-5 p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
          {mode === "signup" ? "Start premium coaching" : "Welcome back"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {mode === "signup" ? "Create your interview workspace" : "Log in to continue practicing"}
        </h1>
      </div>

      {mode === "signup" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            required
          />
          <Input
            placeholder="Target role"
            value={form.targetRole}
            onChange={(event) => setForm((state) => ({ ...state, targetRole: event.target.value }))}
            required
          />
        </div>
      ) : null}

      <Input
        placeholder="Email address"
        type="email"
        value={form.email}
        onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
        required
      />
      <Input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
        required
      />

      {oauthError ? <p className="text-sm text-rose-300">Google sign-in failed: {oauthError.replaceAll("_", " ")}</p> : null}
      {sessionExpired ? <p className="text-sm text-amber-50">Your session expired after 30 minutes of inactivity.</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full py-3">
        {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Login"}
      </Button>
      <Button
        type="button"
        onClick={continueWithGoogle}
        className="google-auth-button w-full gap-3 py-3 shadow-sm"
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
