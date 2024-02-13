import { ArchiveBoxXMarkIcon, PlusIcon } from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import ManualClassActivityLeaveDialogContent from "~/components/DialogContent/ManualClassActivityLeaveDialogContent";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";

export default function ClassActivityLeaveRecordPage() {
  const { data: sessionData } = useSession();

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
    refetch: refetchLeaveRecords,
  } = api.classActivity.getActivityLeaveRecords.useQuery({
    activityId: Number(id),
  });

  const {
    mutate: cancelLeave,
    isLoading: cancelLeaveIsLoading,
    error: cancelLeaveError,
  } = api.classActivity.cancelLeave.useMutation({
    onSuccess: () => refetchLeaveRecords(),
  });

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  if (!isNil(activityError))
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (!isNil(leaveRecordsError))
    return <AlertWarning>{leaveRecordsError.message}</AlertWarning>;
  if (activityIsLoading || leaveRecordsIsLoading)
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
      {cancelLeaveIsLoading && <div className="loading"></div>}
      {cancelLeaveError && (
        <AlertWarning>{cancelLeaveError.message}</AlertWarning>
      )}
      <table className="table table-sm">
        <thead>
          <tr>
            <th>班員</th>
            <th>取消</th>
          </tr>
        </thead>
        <tbody>
          {leaveRecords?.map((record) => (
            <tr key={record.userId}>
              <td>{record.user.name}</td>
              <td>
                <ReactiveButton
                  className="btn btn-sm"
                  onClick={() =>
                    cancelLeave({
                      activityId: activity.id,
                      userId: record.userId,
                    })
                  }
                >
                  <ArchiveBoxXMarkIcon className="h-4 w-4" />
                </ReactiveButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
