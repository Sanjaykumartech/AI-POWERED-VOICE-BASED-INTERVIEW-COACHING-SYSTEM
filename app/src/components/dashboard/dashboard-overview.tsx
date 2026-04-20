import type { DashboardPayload } from "@ai-interview/shared";

import { formatScore } from "@/lib/utils";
import { ActivityHeatmap } from "@/components/analytics/heatmap";
import { LineTrend, TopicBars } from "@/components/analytics/simple-charts";

export function DashboardOverview({ data }: { data: DashboardPayload }) {
  return (
    <div className="space-y-6">
      <section className="glass-card panel-grid overflow-hidden p-6">
        <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/70">Dashboard</p>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-4xl font-semibold text-white">
              {data.profile.name}, your readiness is <span className="text-gradient">{data.profile.readinessScore}%</span>
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Targeting {data.profile.targetRole}. Keep pressure-testing weak spots and the platform will adapt your next sessions.
            </p>
          </div>
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/10 px-5 py-4">
            <p className="text-sm text-cyan-100">AI insight</p>
            <p className="mt-2 max-w-sm text-sm text-slate-200">{data.insights[0]?.description}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sessions" value={String(data.stats.totalSessions)} helper="Every session feeds your memory graph." />
        <StatCard label="Average score" value={formatScore(data.stats.averageScore)} helper="Rolling score across completed evaluations." />
        <StatCard label="Strongest topic" value={data.stats.strongestTopic} helper="Your current top-performing lane." />
        <StatCard label="Weakest topic" value={data.stats.weakestTopic} helper="Ideal candidate for focused repetition." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <LineTrend points={data.readinessTrend} />
        <TopicBars items={data.topicScores} />
      </section>

      <ActivityHeatmap cells={data.heatmap} />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
          <div className="mt-5 space-y-4">
            {data.recentSessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{session.role}</p>
                    <p className="text-sm text-slate-400">{session.topics.join(", ")}</p>
                  </div>
                  <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                    {formatScore(session.averageScore)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white">AI Coaching Insights</h3>
          <div className="mt-5 space-y-4">
            {data.insights.map((insight) => (
              <div key={insight.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{insight.title}</p>
                <p className="mt-2 text-sm text-slate-300">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="glass-card animate-pulseBorder p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{helper}</p>
    </div>
  );
}
