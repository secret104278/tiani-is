"use client";

import { isEmpty } from "lodash";
import InfiniteScroll from "react-infinite-scroll-component";
import ActivityCard from "~/app/_components/activity-card";
import Loading from "~/app/_components/basic/loading";
import { api } from "~/trpc/react";
import { activityIsEnded, Site } from "~/utils/ui";
import { useFilter } from "./filter-context";

export default function ActivityList() {
  const { filterParticipatedByMe, filterOrganizedByMe } = useFilter();

  const [infiniteActivities, infiniteActivitiesQuery] =
    api.volunteerActivity.getAllActivities.useSuspenseInfiniteQuery(
      {
        participatedByMe: filterParticipatedByMe,
        organizedByMe: filterOrganizedByMe,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const activities = infiniteActivities.pages?.flatMap((page) => page.items);

  const onGoingActivities = activities.filter(
    (activity) => !activityIsEnded(activity.endDateTime),
  );
  const endedActivities = activities.filter((activity) =>
    activityIsEnded(activity.endDateTime),
  );

  return (
    <InfiniteScroll
      dataLength={
        (onGoingActivities?.length ?? 0) + (endedActivities?.length ?? 0)
      }
      next={() => infiniteActivitiesQuery.fetchNextPage()}
      hasMore={infiniteActivitiesQuery.hasNextPage}
      loader={<Loading />}
    >
      <div className="flex flex-col space-y-4">
        {onGoingActivities?.map((activity) => (
          <ActivityCard
            key={activity.id}
            site={Site.Volunteer}
            activity={activity}
          />
        ))}
      </div>
      {!isEmpty(endedActivities) && <div className="divider">已結束</div>}
      <div className="flex flex-col space-y-4">
        {endedActivities?.map((activity) => (
          <ActivityCard
            key={activity.id}
            site={Site.Volunteer}
            activity={activity}
            isEnded
          />
        ))}
      </div>
    </InfiniteScroll>
  );
}
