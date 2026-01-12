import { PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import InfiniteScroll from "react-infinite-scroll-component";
import { ActivityCard } from "~/components/ActivityCard";
import { Loading } from "~/components/utils/Loading";
import { api } from "~/utils/api";
import { Site, activityIsEnded, getUnitBySlug, siteToTitle } from "~/utils/ui";

export default function WorkHome() {
  const router = useRouter();
  const { unitSlug } = router.query;
  const unit = getUnitBySlug(unitSlug as string);

  const activitiesQuery =
    api.workActivity.getAllActivitiesInfinite.useInfiniteQuery(
      { unit: unit?.name ?? "" },
      {
        enabled: !!unit,
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
        <h1>{siteToTitle(Site.Work, unit?.name)}</h1>
      </article>
      <div className="flex flex-row justify-end space-x-4">
        <Link
          href={`/work/${unitSlug}/activity/new`}
          className="flex-shrink-0"
        >
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
                unitSlug={unitSlug as string}
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
                unitSlug={unitSlug as string}
              />
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}
