import { PlusIcon } from "@heroicons/react/20/solid";
import { orderBy } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/utils/api";

export default function Home() {
  const { data: sessionData } = useSession();

  const { data: activities, isLoading } =
    api.volunteerActivity.getOrganizedActivities.useQuery({});

  if (!sessionData) {
    return <span className="loading loading-ring loading-md"></span>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>志工活動</h1>
      </article>
      <div className="flex flex-row justify-end">
        <Link href="/volunteeractivity/new">
          <div className="btn">
            <PlusIcon className="h-4 w-4" />
            建立新活動
          </div>
        </Link>
      </div>
      <div>
        {isLoading && <div className="loading loading-lg"></div>}
        <div className="divider">即將到達</div>
        <div className="flex flex-col space-y-4">
          {orderBy(activities, "startDateTime", "desc")?.map((activity) => (
            <Link
              key={activity.id}
              href={`/volunteeractivity/detail/${activity.id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="card card-compact w-full bg-neutral text-neutral-content shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">{activity.title}</h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
