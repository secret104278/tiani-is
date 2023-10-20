import {
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { orderBy } from "lodash";
import Link from "next/link";
import { api } from "~/utils/api";
import { getActivityStatusText } from "~/utils/ui";

export default function Home() {
  const { data: activities, isLoading } =
    api.volunteerActivity.getAllActivities.useQuery({});

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
      <div className="flex flex-row justify-end">
        <Link href="/volunteeractivity/new">
          <div className="btn">
            <PlusIcon className="h-4 w-4" />
            建立新工作
          </div>
        </Link>
      </div>
      <div>
        {isLoading && <div className="loading loading-lg"></div>}
        <div className="divider">即將到達</div>
        <div className="flex flex-col space-y-4">
          {orderBy(onGoingActivities, "startDateTime", "asc")?.map(
            (activity) => (
              <Link
                key={activity.id}
                href={`/volunteeractivity/detail/${activity.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card-compact card w-full bg-accent text-accent-content shadow-xl">
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
        <div className="divider">已結束</div>
        <div className="flex flex-col space-y-4">
          {orderBy(endedActivities, "startDateTime", "desc")?.map(
            (activity) => (
              <Link
                key={activity.id}
                href={`/volunteeractivity/detail/${activity.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card-compact card w-full bg-base-200 shadow-xl">
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
