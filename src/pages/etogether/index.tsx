import { PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { ActivityCard } from "~/components/ActivityCard";
import { Loading } from "~/components/utils/Loading";
import { api } from "~/utils/api";
import { activityIsEnded } from "~/utils/ui";

export default function EtogetherHome() {
  const { data: session } = useSession();

  const [filterParticipatedByMe, setFilterParticipatedByMe] = useState(false);

  const activitiesQuery =
    api.etogetherActivity.getAllActivitiesInfinite.useInfiniteQuery(
      {
        participatedByMe: filterParticipatedByMe,
      },
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
        <h1>活動總覽</h1>
      </article>
      {session?.user.role.is_etogether_admin && (
        <div className="flex flex-row justify-end space-x-4">
          <Link href="/etogether/activity/new" className="flex-shrink-0">
            <div className="btn">
              <PlusIcon className="h-4 w-4" />
              建立新活動
            </div>
          </Link>
        </div>
      )}
      <div className="flex flex-row flex-wrap">
        <label className="label cursor-pointer space-x-2">
          <span className="label-text">我參加的</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={filterParticipatedByMe}
            onChange={() => setFilterParticipatedByMe((prev) => !prev)}
          />
        </label>
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
