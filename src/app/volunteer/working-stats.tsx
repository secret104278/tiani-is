"use client";

import Link from "next/link";
import HourStats from "~/app/_components/hour-stats";
import { api } from "~/trpc/react";
import { volunteerWorkingStatsHref } from "~/utils/navigation";

export default function WorkingStats() {
  const [workingStats] = api.volunteerActivity.getWorkingStats.useSuspenseQuery(
    {},
  );

  return (
    <Link href={volunteerWorkingStatsHref()} className="flex flex-col">
      <HourStats
        title="總服務小時"
        totalWorkingHours={workingStats.totalWorkingHours}
      />
    </Link>
  );
}
