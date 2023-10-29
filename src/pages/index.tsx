import {
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { isEmpty } from "lodash";
import Link from "next/link";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { api } from "~/utils/api";
import { getActivityStatusText } from "~/utils/ui";

export default function Home() {
  const [filterOrganizedByMe, setFilterOrganizedByMe] = useState(false);
  const [filterParticipatedByMe, setFilterParticipatedByMe] = useState(false);

  const activitiesQuery =
    api.volunteerActivity.getAllActivitiesInfinite.useInfiniteQuery(
      {
        organizedByMe: filterOrganizedByMe,
        participatedByMe: filterParticipatedByMe,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const activities = activitiesQuery.data?.pages?.flatMap((page) => page.items);
  console.log(activities);

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
        <h1>工作總覽</h1>
      </article>
      {!workingStatsIsLoading && (
        <div className="stats stats-vertical shadow-lg sm:stats-horizontal">
          <Link href="/personal/workingstats">
            <div className="stat">
              <div className="stat-figure text-primary">
                <ClockIcon className="h-8 w-8" />
              </div>
              <div className="stat-title">總服務小時</div>
              <div className="stat-value">
                {workingStats?.totalWorkingHours?.toFixed(2)}
              </div>
            </div>
          </Link>
        </div>
      )}
      <div className="flex flex-row">
        <div className="flex flex-row flex-wrap">
          <label className="label cursor-pointer space-x-2">
            <span className="label-text">我發起的</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={filterOrganizedByMe}
              onChange={() => setFilterOrganizedByMe((prev) => !prev)}
            />
          </label>
          <label className="label cursor-pointer space-x-2">
            <span className="label-text">我報名的</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={filterParticipatedByMe}
              onChange={() => setFilterParticipatedByMe((prev) => !prev)}
            />
          </label>
        </div>
        <div className="grow" />
        <Link href="/volunteeractivity/new" className="flex-shrink-0">
          <div className="btn">
            <PlusIcon className="h-4 w-4" />
            建立新工作
          </div>
        </Link>
      </div>
      <div>
        {activitiesQuery.isLoading && (
          <div className="mt-4 flex flex-row justify-center">
            <div className="loading" />
          </div>
        )}
        <InfiniteScroll
          dataLength={
            (onGoingActivities?.length ?? 0) + (endedActivities?.length ?? 0)
          }
          next={() => activitiesQuery.fetchNextPage()}
          hasMore={activitiesQuery.hasNextPage ?? false}
          loader={
            <div className="mt-4 flex flex-row justify-center">
              <div className="loading" />
            </div>
          }
        >
          <div className="flex flex-col space-y-4">
            {onGoingActivities?.map((activity) => (
              <Link
                key={activity.id}
                href={`/volunteeractivity/detail/${activity.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card-compact card w-full bg-accent text-accent-content shadow">
                  <div className="card-body">
                    <div className="flex flex-row items-center justify-between">
                      <h2 className="card-title">{activity.title}</h2>
                      <div className="space-x-2">
                        <div className="badge badge-outline">
                          {getActivityStatusText(activity.status)}
                        </div>
                        {activity._count.participants >= activity.headcount && (
                          <div className="badge badge-primary">已額滿</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="mr-1 h-4 w-4" />
                      <p>人數：{activity.headcount} 人</p>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="mr-1 h-4 w-4" />
                      <p>地點：{activity.location}</p>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="mr-1 h-4 w-4" />
                      <p>開始：{activity.startDateTime.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="mr-1 h-4 w-4" />
                      <p>結束：{activity.endDateTime.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {!isEmpty(endedActivities) && <div className="divider">已結束</div>}
          <div className="flex flex-col space-y-4">
            {endedActivities?.map((activity) => (
              <Link
                key={activity.id}
                href={`/volunteeractivity/detail/${activity.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card-compact card w-full bg-base-200 shadow">
                  <div className="card-body">
                    <h2 className="card-title">{activity.title}</h2>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}
