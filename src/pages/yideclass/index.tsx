import { ClockIcon, PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty } from "lodash";
import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { ActivityCard } from "~/components/ActivityCard";
import { Loading } from "~/components/Loading";
import { api } from "~/utils/api";

export default function YiDeClassHome() {
  const activitiesQuery =
    api.classActivity.getAllActivitiesInfinite.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const activities = activitiesQuery.data?.pages?.flatMap((page) => page.items);

  const { data: workingStats, isLoading: workingStatsIsLoading } =
    api.volunteerActivity.getWorkingStats.useQuery({});

  const onGoingActivities = activities?.filter(
    (activity) => activity.endDateTime > new Date(),
  );
  const endedActivities = activities?.filter(
    (activity) => activity.endDateTime <= new Date(),
  );

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>開班總覽</h1>
      </article>
      <div className="stats stats-vertical shadow-lg sm:stats-horizontal">
        <div className="stat">
          <div className="stat-figure text-primary">
            <ClockIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">總開班時數</div>
          <div className="stat-value">1.02</div>
        </div>
      </div>
      <div className="flex flex-row justify-end space-x-4">
        <Link href="/yideclass/activity/new" className="flex-shrink-0">
          <div className="btn">
            <PlusIcon className="h-4 w-4" />
            建立新課程
          </div>
        </Link>
      </div>
      <div>
        {activitiesQuery.isLoading && <Loading />}
        <InfiniteScroll
          dataLength={
            (onGoingActivities?.length ?? 0) + (endedActivities?.length ?? 0)
          }
          next={() => activitiesQuery.fetchNextPage()}
          hasMore={activitiesQuery.hasNextPage ?? false}
          loader={<Loading />}
        >
          <div className="flex flex-col space-y-4">
            {onGoingActivities?.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
          {!isEmpty(endedActivities) && <div className="divider">已結束</div>}
          <div className="flex flex-col space-y-4">
            {endedActivities?.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} isEnd />
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}
