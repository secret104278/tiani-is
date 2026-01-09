import { isEmpty, isNil, isString } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";

export default function ClassActivityAbsentPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.classActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  const {
    data: leaveRecords,
    isLoading: leaveRecordsIsLoading,
    error: leaveRecordsError,
  } = api.classActivity.getActivityLeaveRecords.useQuery({
    activityId: Number(id),
  });

  const {
    data: checkRecords,
    isLoading: checkRecordsIsLoading,
    error: checkRecordsError,
  } = api.classActivity.getActivityCheckRecords.useQuery({
    activityId: Number(id),
  });

  const {
    data: classMemberEnrollments,
    isLoading: classMemberEnrollmentsIsLoading,
    error: classMemberEnrollmentsError,
  } = api.classActivity.getClassMemberEnrollments.useQuery(
    {
      classTitle: activity?.title ?? "",
    },
    { enabled: isString(activity?.title) && !isEmpty(activity?.title) },
  );

  if (!isNil(activityError))
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (!isNil(leaveRecordsError))
    return <AlertWarning>{leaveRecordsError.message}</AlertWarning>;
  if (!isNil(checkRecordsError))
    return <AlertWarning>{checkRecordsError.message}</AlertWarning>;
  if (!isNil(classMemberEnrollmentsError))
    return <AlertWarning>{classMemberEnrollmentsError.message}</AlertWarning>;
  if (
    activityIsLoading ||
    leaveRecordsIsLoading ||
    checkRecordsIsLoading ||
    classMemberEnrollmentsIsLoading
  )
    return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  const checkedUserIds = checkRecords?.map((record) => record.userId) ?? [];
  const leaveUserIds = leaveRecords?.map((record) => record.userId) ?? [];
  const absentUser =
    (
      classMemberEnrollments?.filter(
        (enrollment) =>
          !checkedUserIds.includes(enrollment.userId) &&
          !leaveUserIds.includes(enrollment.userId),
      ) ?? []
    ).map((enrollment) => enrollment.user) ?? [];

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/class/activity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>缺席名單</h1>
      </article>
      <table className="table-sm table">
        <thead>
          <tr>
            <th>班員</th>
          </tr>
        </thead>
        <tbody>
          {absentUser?.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
