import { isEmpty, sortBy } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";
import { formatDate } from "~/utils/ui";

export default function YiDeAdminClassDetail() {
  const router = useRouter();
  const { title } = router.query;

  const {
    data: activities,
    isLoading: activitiesIsLoading,
    error: activitiesError,
  } = api.classActivity.getActivitiesByTitle.useQuery({
    title: String(title),
  });

  const {
    data: classMemberEnrollments,
    isLoading: classMemberEnrollmentsIsLoading,
    error: classMemberEnrollmentsError,
  } = api.classActivity.getClassMemberEnrollments.useQuery({
    classTitle: String(title),
  });

  if (activitiesIsLoading || classMemberEnrollmentsIsLoading)
    return <div className="loading" />;
  if (!isEmpty(classMemberEnrollmentsError))
    return <AlertWarning>{classMemberEnrollmentsError.message}</AlertWarning>;
  if (!isEmpty(activitiesError))
    return <AlertWarning>{activitiesError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <div className="link" onClick={() => router.back()}>
        ← 上一頁
      </div>
      <article className="prose">
        <h1>{title}</h1>
      </article>
      <Link href={`/yideclass/admin/class/enroll/${String(title)}`}>
        <button className="btn">班員管理</button>
      </Link>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">目前班員數</div>
          <div className="stat-value">{classMemberEnrollments?.length}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>開班人數</th>
              <th>請假人數</th>
              <th>缺席人數</th>
            </tr>
          </thead>
          <tbody>
            {sortBy(activities, "startDateTime")
              ?.reverse()
              .map((activity, idx) => (
                <tr
                  key={idx}
                  className="hover hover:cursor-pointer"
                  onClick={() =>
                    void router.push(
                      `/yideclass/activity/detail/${activity.id}`,
                    )
                  }
                >
                  <td>{formatDate(activity.startDateTime)}</td>
                  <td>{activity.checkInUserCount}</td>
                  <td>{activity.leaveUserCount}</td>
                  <td>{activity.absentUserCount}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
