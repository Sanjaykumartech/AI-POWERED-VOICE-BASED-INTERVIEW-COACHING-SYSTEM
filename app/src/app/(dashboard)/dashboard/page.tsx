"use client";

import type { DashboardPayload } from "@ai-interview/shared";
import { useEffect, useState } from "react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    void apiClient.request<DashboardPayload>("/analytics/dashboard").then(setData).catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return <DashboardOverview data={data} />;
}

