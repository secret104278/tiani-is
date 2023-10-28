import { PencilSquareIcon } from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function VolunteerActivityCheckRecordPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.volunteerActivity.getActivity.useQuery(
    {
      id: Number(id),
    },
  );
  const { activity } = data ?? {};

  const { data: checkRecords, isLoading: isLoadingCheckRecords } =
    api.volunteerActivity.getActivityCheckRecords.useQuery({
      activityId: Number(id),
    });

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading || isLoadingCheckRecords)
    return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/volunteeractivity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>打卡名單</h1>
      </article>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>志工</th>
            <th>簽到</th>
            <th>簽退</th>
            <th>補正</th>
          </tr>
        </thead>
        <tbody>
          {checkRecords?.map((record) => (
            <tr key={record.name}>
              <td>{record.name}</td>
              <td>
                {record.checkinat && (
                  <>
                    {record.checkinat.toLocaleDateString()}
                    <br />
                    {record.checkinat.toLocaleTimeString()}
                  </>
                )}
              </td>
              <td>
                {record.checkoutat && (
                  <>
                    {record.checkoutat.toLocaleDateString()}
                    <br />
                    {record.checkoutat.toLocaleTimeString()}
                  </>
                )}
              </td>
              <td>
                <button className="btn btn-sm">
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
