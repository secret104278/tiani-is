import {
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { orderBy } from "lodash";
import Link from "next/link";
import { useState } from "react";
import { api } from "~/utils/api";
import { getActivityStatusText } from "~/utils/ui";

export default function Home() {
  const [filterOrganizedByMe, setFilterOrganizedByMe] = useState(false);
  const [filterParticipatedByMe, setFilterParticipatedByMe] = useState(false);

  const { data: activities, isLoading } =
    api.volunteerActivity.getAllActivities.useQuery({
      organizedByMe: filterOrganizedByMe,
      participatedByMe: filterParticipatedByMe,
    });

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
        <Link href="/personal/workingstats">
          <div className="stats stats-vertical shadow-lg sm:stats-horizontal">
            <div className="stat">
              <div className="stat-figure text-primary">
                <ClockIcon className="h-8 w-8" />
              </div>
              <div className="stat-title">總服務小時</div>
              <div className="stat-value">
                {workingStats?.totalWorkingHours?.toFixed(2)}
              </div>
            </div>
          </div>
        </Link>
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
        {isLoading && <div className="loading loading-lg"></div>}
        {onGoingActivities?.length !== 0 && (
          <div className="divider">即將到達</div>
        )}
        <div className="flex flex-col space-y-4">
          {orderBy(onGoingActivities, "startDateTime", "asc")?.map(
            (activity) => (
              <Link
                key={activity.id}
                href={`/volunteeractivity/detail/${activity.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card-compact card w-full bg-accent text-accent-content shadow-lg">
                  <div className="card-body">
                    <div className="flex flex-row items-center justify-between">
                      <h2 className="card-title">{activity.title}</h2>
                      <div className="badge badge-outline">
                        {getActivityStatusText(activity.status)}
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
            ),
          )}
        </div>
        {endedActivities?.length !== 0 && <div className="divider">已結束</div>}
        <div className="flex flex-col space-y-4">
          {orderBy(endedActivities, "startDateTime", "desc")?.map(
            (activity) => (
              <Link
                key={activity.id}
                href={`/volunteeractivity/detail/${activity.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card-compact card w-full bg-base-200 shadow-lg">
                  <div className="card-body">
                    <h2 className="card-title">{activity.title}</h2>
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
