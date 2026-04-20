import type { UserProfile } from "@ai-interview/shared";

export function ProfileSummary({ profile }: { profile: UserProfile }) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-semibold text-white">{profile.name}</h2>
      <p className="mt-2 text-slate-300">{profile.email}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Target role</p>
          <p className="mt-2 font-medium text-white">{profile.targetRole}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Readiness score</p>
          <p className="mt-2 font-medium text-white">{profile.readinessScore}/100</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Preferred categories</p>
          <p className="mt-2 font-medium text-white">{profile.preferences.preferredCategories.join(", ")}</p>
        </div>
      </div>
    </div>
  );
}

