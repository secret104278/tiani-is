"use client";

import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import AlertWarning from "~/app/_components/basic/alert-warning";
import Dialog from "~/app/_components/basic/dialog";
import ReactiveButton from "~/app/_components/basic/reactive-button";
import ModifyCheckRecordDialogContent from "~/app/volunteer/_components/modify-check-record-dialog-content";
import { api } from "~/trpc/react";
import { volunteerActivityDetailHref } from "~/utils/navigation";
import type { CheckRecord } from "~/utils/types";
import { formatDate } from "~/utils/ui";
import ManualVolunteerActivityRegisterDialogContent from "./manual-volunteer-activity-register-dialog-content";

export default function VolunteerActivityCheckRecordPage() {
  const { data: sessionData } = useSession();
  const { id } = useParams();

  const { data, isLoading, error } = api.volunteerActivity.getActivity.useQuery(
    {
      id: Number(id),
    },
  );
  const { activity } = data ?? {};

  const {
    data: checkRecords,
    isLoading: checkRecordsIsLoading,
    error: checkRecordsError,
    refetch: refetchCheckRecords,
  } = api.volunteerActivity.getActivityCheckRecords.useQuery({
    activityId: Number(id),
  });

  const [modifyCheckRecordDialogOpen, setModifyCheckRecordDialogOpen] =
    useState(false);
  const [modifyRecord, setModifyRecord] = useState<CheckRecord | undefined>(
    undefined,
  );

  const [manualRegisterDialogOpen, setManualRegisterDialogOpen] =
    useState(false);

  const {
    mutate: managerCheckInActivity,
    isPending: managerCheckInActivityIsLoading,
    error: managerCheckInActivityError,
  } = api.volunteerActivity.managerCheckInActivity.useMutation({
    onSuccess: () => {
      void refetchCheckRecords();
      setModifyCheckRecordDialogOpen(false);
    },
  });

  if (error) return <AlertWarning>{error.message}</AlertWarning>;
  if (checkRecordsError)
    return <AlertWarning>{checkRecordsError.message}</AlertWarning>;
  if (isLoading || checkRecordsIsLoading)
    return <div className="loading"></div>;
  if (!activity) return <AlertWarning>找不到工作</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={volunteerActivityDetailHref(activity.id)}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>打卡名單</h1>
      </article>
      <div className="flex justify-end">
        <ReactiveButton
          className="btn"
          onClick={() => setManualRegisterDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          手動報名
        </ReactiveButton>
        <Dialog
          title="手動報名"
          show={manualRegisterDialogOpen}
          closeModal={() => setManualRegisterDialogOpen(false)}
        >
          <ManualVolunteerActivityRegisterDialogContent
            activityId={activity.id}
          />
        </Dialog>
      </div>

      <Dialog
        title="補正紀錄"
        show={modifyCheckRecordDialogOpen}
        closeModal={() => setModifyCheckRecordDialogOpen(false)}
      >
        <ModifyCheckRecordDialogContent
          userName={modifyRecord?.user.name ?? ""}
          defaultCheckInAt={modifyRecord?.checkInAt}
          defaultCheckOutAt={modifyRecord?.checkOutAt ?? undefined}
          onConfirm={(checkInAt, checkOutAt) => {
            managerCheckInActivity({
              activityId: activity.id,
              userId: modifyRecord?.user.id ?? "",
              checkInAt: checkInAt,
              checkOutAt: checkOutAt,
            });
          }}
          isLoading={managerCheckInActivityIsLoading}
          error={managerCheckInActivityError?.message}
        />
      </Dialog>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>志工</th>
            <th>簽到</th>
            <th>簽退</th>
            {sessionData?.user.role.is_volunteer_admin && <th>補正</th>}
          </tr>
        </thead>
        <tbody>
          {checkRecords?.map((record) => (
            <tr key={record.user.id}>
              <td>{record.user.name}</td>
              <td>
                {record.checkInAt && (
                  <>
                    {formatDate(record.checkInAt)}
                    <br />
                    {record.checkInAt.toLocaleTimeString()}
                  </>
                )}
              </td>
              <td>
                {record.checkOutAt && (
                  <>
                    {formatDate(record.checkOutAt)}
                    <br />
                    {record.checkOutAt.toLocaleTimeString()}
                  </>
                )}
              </td>
              {sessionData?.user.role.is_volunteer_admin && (
                <td>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setModifyRecord(record);
                      setModifyCheckRecordDialogOpen(true);
                    }}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
