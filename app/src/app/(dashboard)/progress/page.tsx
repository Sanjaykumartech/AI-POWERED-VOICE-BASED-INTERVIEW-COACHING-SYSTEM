"use client";

import type { DashboardPayload } from "@ai-interview/shared";
import { useEffect, useState } from "react";

import { ActivityHeatmap } from "@/components/analytics/heatmap";
import { LineTrend, TopicBars } from "@/components/analytics/simple-charts";
import { apiClient } from "@/lib/api";

export default function ProgressPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    void apiClient.request<DashboardPayload>("/analytics/dashboard").then(setData).catch(console.error);
  }, []);

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <h2 className="text-3xl font-semibold text-white">Progress & Analytics</h2>
        <p className="mt-3 text-slate-300">
          Track improvement, regression, and consistency with daily heatmaps and topic-specific score momentum.
        </p>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <LineTrend points={data.readinessTrend} />
        <TopicBars items={data.topicScores} />
      </section>
      <ActivityHeatmap cells={data.heatmap} />
    </div>
  );
}

