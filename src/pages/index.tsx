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
    <>
      <h1>志工活動</h1>
      <Link href="/volunteeractivity/new">
        <div className="btn">建立新活動</div>
      </Link>
      <div>
        {isLoading && <div className="loading loading-lg"></div>}
        {activities?.map((activity) => (
          <Link key={activity.id} href={`/volunteeractivity/${activity.id}`}>
            <div className="card card-compact w-full bg-neutral text-neutral-content shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{activity.title}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
