import { isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function ClassActivityCheckRecordPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.classActivity.getActivity.useQuery({
    id: Number(id),
  });
  const { activity } = data ?? {};

  const { data: checkRecords, isLoading: isLoadingCheckRecords } =
    api.classActivity.getActivityCheckRecords.useQuery({
      activityId: Number(id),
    });

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading || isLoadingCheckRecords)
    return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/yideclass/activity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>打卡名單</h1>
      </article>

      <table className="table table-sm">
        <thead>
          <tr>
            <th>學員</th>
            <th>簽到</th>
          </tr>
        </thead>
        <tbody>
          {checkRecords?.map((record) => (
            <tr key={record.userId}>
              <td>{record.user.name}</td>
              <td>
                {record.checkAt.toLocaleDateString()}
                <br />
                {record.checkAt.toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
