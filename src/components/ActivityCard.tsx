import {
  ClockIcon,
  FlagIcon,
  MapPinIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import type { VolunteerActivityStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSiteContext } from "~/context/SiteContext";
import {
  Site,
  formatDateTime,
  getActivityStatusText,
  getUnitByName,
  toDuration,
  urlBaseToSite,
} from "~/utils/ui";

export function ActivityCard({
  activity,
  isEnd,
  unitSlug: propUnitSlug,
}: {
  activity: {
    id: number;
    title: string;
    status: VolunteerActivityStatus;
    // _count?: {
    //   participants: number;
    // };
    headcount?: number;
    location: string;
    startDateTime: Date;
    endDateTime: Date;
    festival?: string | null;
  };
  isEnd?: boolean;
  unitSlug?: string;
}) {
  const router = useRouter();
  const { site: contextSite, unitName } = useSiteContext();
  const site = contextSite ?? urlBaseToSite(router.pathname.split("/")[1]);
  const unitSlug = propUnitSlug ?? getUnitByName(unitName)?.slug;

  const href =
    site === Site.Class || site === Site.Work
      ? `/${site}/${unitSlug}/activity/detail/${activity.id}`
      : `/${site}/activity/detail/${activity.id}`;

  if (isEnd)
    return (
      <Link key={activity.id} href={href} style={{ textDecoration: "none" }}>
        <div className="card card-compact w-full bg-base-200 shadow">
          <div className="card-body">
            <h2 className="card-title">{activity.title}</h2>
            <div className="flex items-center">
              <MapPinIcon className="mr-1 h-4 w-4" />
              <p>{activity.location}</p>
            </div>
            <div className="flex items-center">
              <ClockIcon className="mr-1 h-4 w-4" />
              <p>{formatDateTime(activity.startDateTime)}</p>
            </div>
          </div>
        </div>
      </Link>
    );

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div className="card-compact card w-full bg-accent text-accent-content shadow">
        <div className="card-body">
          <div className="flex flex-row items-center justify-between">
            <h2 className="card-title">{activity.title}</h2>
            <div className="flex-shrink-0 space-x-2">
              <div className="badge badge-outline">
                {getActivityStatusText(activity.status)}
              </div>
              {/* {!isNil(activity._count) &&
                !isNil(activity.headcount) &&
                activity._count.participants >= activity.headcount && (
                  <div className="badge badge-primary">已額滿</div>
                )} */}
            </div>
          </div>
          {activity.festival && (
            <div className="flex items-center">
              <FlagIcon className="mr-1 h-4 w-4" />
              <p>節日：{activity.festival}</p>
            </div>
          )}
          {activity.headcount && (
            <div className="flex items-center">
              <UsersIcon className="mr-1 h-4 w-4" />
              <p>人數：{activity.headcount} 人</p>
            </div>
          )}
          <div className="flex items-center">
            <MapPinIcon className="mr-1 h-4 w-4" />
            <p>地點：{activity.location}</p>
          </div>
          <div className="flex items-center">
            <ClockIcon className="mr-1 h-4 w-4" />
            <p>開始：{formatDateTime(activity.startDateTime)}</p>
          </div>
          {site !== Site.Work && (
            <div className="flex items-center">
              <ClockIcon className="mr-1 h-4 w-4" />
              <p>
                {site === Site.Volunteer ? "預估時數：" : "開班時數："}
                {toDuration(activity.startDateTime, activity.endDateTime)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
