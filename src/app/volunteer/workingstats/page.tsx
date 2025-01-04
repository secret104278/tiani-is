"use client";

import WorkingStatsPanel from "~/app/volunteer/_components/working-stats-panel";
import { api } from "~/trpc/react";

export default function WorkingStatsPage() {
  const { data: workingStats, isLoading: workingStatsIsLoading } =
    api.volunteerActivity.getWorkingStats.useQuery({});

  if (workingStatsIsLoading) return <div className="loading" />;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>打卡紀錄</h1>
      </article>
      {workingStats && <WorkingStatsPanel workingStats={workingStats} />}
    </div>
  );
}
