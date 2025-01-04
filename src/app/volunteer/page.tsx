import { PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Suspense } from "react";
import Loading from "~/app/_components/basic/loading";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { newVolunteerActivityHref } from "~/utils/navigation";
import CasualCheckInCard from "./casual-check-in-card";
import ClientActivitySection from "./client-activity-section";
import WorkingStats from "./working-stats";

export default async function VolunteerPage() {
  const session = await auth();
  if (session?.user) {
    // TODO: how to manage prefetch well?
    void api.volunteerActivity.getAllActivities.prefetchInfinite(
      {
        participatedByMe: false,
        organizedByMe: false,
      },
      {
        pages: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );
    void api.volunteerActivity.getWorkingStats.prefetch({});
  }

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>工作總覽</h1>
      </article>
      <div className="flex flex-row justify-end space-x-4">
        <Link href={newVolunteerActivityHref()} className="flex-shrink-0">
          <div className="btn">
            <PlusIcon className="h-4 w-4" />
            建立新工作
          </div>
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <WorkingStats />
      </Suspense>
      <CasualCheckInCard />
      <ClientActivitySection />
    </div>
  );
}
