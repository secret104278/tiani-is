import { PlusIcon } from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AlertWarning } from "~/components/Alert";
import ManualClassActivityCheckInDialogContent from "~/components/CheckInDialog/ManualClassActivityCheckInDialogContent";
import ReactiveButton from "~/components/ReactiveButton";
import Dialog from "~/components/utils/Dialog";
import { api } from "~/utils/api";
import { formatDate } from "~/utils/ui";

export default function ClassActivityCheckRecordPage() {
  const { data: sessionData } = useSession();

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

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

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
      {sessionData?.user.role.is_yideclass_admin && (
        <div className="flex justify-end">
          <ReactiveButton
            className="btn"
            onClick={() => setCheckInDialogOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            手動打卡
          </ReactiveButton>
          <Dialog
            title="手動打卡"
            show={checkInDialogOpen}
            closeModal={() => setCheckInDialogOpen(false)}
          >
            <ManualClassActivityCheckInDialogContent activityId={activity.id} />
          </Dialog>
        </div>
      )}
      <table className="table table-sm">
        <thead>
          <tr>
            <th>班員</th>
            <th>簽到</th>
          </tr>
        </thead>
        <tbody>
          {checkRecords?.map((record) => (
            <tr key={record.userId}>
              <td>{record.user.name}</td>
              <td>
                {formatDate(record.checkAt)}
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
