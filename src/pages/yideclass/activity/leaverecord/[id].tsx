import { PlusIcon } from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AlertWarning } from "~/components/Alert";
import ManualClassActivityLeaveDialogContent from "~/components/CheckInDialog/ManualClassActivityLeaveDialogContent";
import ReactiveButton from "~/components/ReactiveButton";
import Dialog from "~/components/utils/Dialog";
import { api } from "~/utils/api";

export default function ClassActivityLeaveRecordPage() {
  const { data: sessionData } = useSession();

  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.classActivity.getActivity.useQuery({
    id: Number(id),
  });
  const { activity } = data ?? {};

  const {
    data: leaveRecords,
    isLoading: leaveRecordsIsLoading,
    error: leaveRecordsError,
  } = api.classActivity.getActivityLeaveRecords.useQuery({
    activityId: Number(id),
  });

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (!isNil(leaveRecordsError))
    return <AlertWarning>{leaveRecordsError.message}</AlertWarning>;
  if (isLoading || leaveRecordsIsLoading)
    return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/yideclass/activity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>請假名單</h1>
      </article>
      {sessionData?.user.role.is_yideclass_admin && (
        <div className="flex justify-end">
          <ReactiveButton
            className="btn"
            onClick={() => setCheckInDialogOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            手動請假
          </ReactiveButton>
          <Dialog
            title="手動請假"
            show={checkInDialogOpen}
            closeModal={() => setCheckInDialogOpen(false)}
          >
            <ManualClassActivityLeaveDialogContent activityId={activity.id} />
          </Dialog>
        </div>
      )}
      <table className="table table-sm">
        <thead>
          <tr>
            <th>班員</th>
          </tr>
        </thead>
        <tbody>
          {leaveRecords?.map((record) => (
            <tr key={record.userId}>
              <td>{record.user.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
