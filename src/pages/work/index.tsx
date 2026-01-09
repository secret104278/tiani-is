import { PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty } from "lodash";
import Link from "next/link";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { ActivityCard } from "~/components/ActivityCard";
import { Loading } from "~/components/utils/Loading";
import { api } from "~/utils/api";
import { activityIsEnded } from "~/utils/ui";

export default function WorkHome() {
  const activitiesQuery =
    api.yideworkActivity.getAllActivitiesInfinite.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const activities = activitiesQuery.data?.pages?.flatMap((page) => page.items);

  const onGoingActivities = activities?.filter(
    (activity) => !activityIsEnded(activity.endDateTime),
  );
  const endedActivities = activities?.filter((activity) =>
    activityIsEnded(activity.endDateTime),
  );

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>道務總覽</h1>
      </article>
      <div className="flex flex-row justify-end space-x-4">
        <Link href="/work/activity/new" className="flex-shrink-0">
          <div className="btn">
            <PlusIcon className="h-4 w-4" />
            建立新通知
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
              <ActivityCard
                key={activity.id}
                activity={{ ...activity, location: activity.location.name }}
              />
            ))}
          </div>
          {!isEmpty(endedActivities) && <div className="divider">已結束</div>}
          <div className="flex flex-col space-y-4">
            {endedActivities?.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={{ ...activity, location: activity.location.name }}
                isEnd
              />
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}
