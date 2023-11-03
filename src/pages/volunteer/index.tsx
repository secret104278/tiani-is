import {
  ArrowDownOnSquareIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { isEmpty, isNil } from "lodash";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { api } from "~/utils/api";
import { getActivityStatusText } from "~/utils/ui";

const CasualCheckInDialog = dynamic(
  () => import("~/components/CasualCheckInDialog"),
  {
    ssr: false,
  },
);

export default function VolunteerHome() {
  const [filterOrganizedByMe, setFilterOrganizedByMe] = useState(false);
  const [filterParticipatedByMe, setFilterParticipatedByMe] = useState(false);

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const {
    data: latestCasualCheckIn,
    isLoading: latestCasualCheckInIsLoading,
    refetch: refetchLatestCasualCheckIn,
  } = api.volunteerActivity.getLatestCasualCheckIn.useQuery({});

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
          <Link href="/volunteer/workingstats">
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
      <div className="flex flex-row justify-end">
        <div className="card card-compact w-full shadow-lg">
          <div className="card-body">
            <h2 className="card-title">日常工作</h2>
            <div className="flex items-center"></div>
            {latestCasualCheckInIsLoading && <div className="loading" />}
            {isEmpty(latestCasualCheckIn) && "今日尚未簽到"}
            {!isEmpty(latestCasualCheckIn) && (
              <div className="flex items-center">
                <p>簽到：{latestCasualCheckIn.checkInAt.toLocaleString()}</p>
              </div>
            )}
            {!isNil(latestCasualCheckIn?.checkOutAt) && (
              <div className="flex items-center">
                <p>簽退：{latestCasualCheckIn!.checkOutAt.toLocaleString()}</p>
              </div>
            )}
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary"
                onClick={() => setCheckInDialogOpen(true)}
              >
                <ArrowDownOnSquareIcon className="h-4 w-4" />
                {isEmpty(latestCasualCheckIn) && "簽到"}
                {!isEmpty(latestCasualCheckIn) &&
                latestCasualCheckIn.checkOutAt !== null
                  ? "再次簽到"
                  : "簽退"}
              </button>
            </div>
          </div>
        </div>
        <CasualCheckInDialog
          open={checkInDialogOpen}
          onClose={() => setCheckInDialogOpen(false)}
          onCheckInSuccess={() => void refetchLatestCasualCheckIn()}
        />
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row justify-end space-x-4">
          <Link href="/volunteer/activity/new" className="flex-shrink-0">
            <div className="btn">
              <PlusIcon className="h-4 w-4" />
              建立新工作
            </div>
          </Link>
        </div>
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
                href={`/volunteer/activity/detail/${activity.id}`}
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
                href={`/volunteer/activity/detail/${activity.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card-compact card w-full bg-base-200 shadow">
                  <div className="card-body">
                    <h2 className="card-title">{activity.title}</h2>
                    <div className="flex items-center">
                      <MapPinIcon className="mr-1 h-4 w-4" />
                      <p>{activity.location}</p>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="mr-1 h-4 w-4" />
                      <p>{activity.startDateTime.toLocaleString()}</p>
                    </div>
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
