import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import ManualVolunteerActivityRegisterDialogContent from "~/components/DialogContent/ManualVolunteerActivityRegisterDialogContent";
import { ModifyCheckRecordDialog } from "~/components/ModifyCheckRecordDialog";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";
import type { CheckRecord } from "~/utils/types";
import { formatDate } from "~/utils/ui";

export default function VolunteerActivityCheckRecordPage() {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const { id } = router.query;

  const { data, isLoading, error } = api.volunteerActivity.getActivity.useQuery(
    {
      id: Number(id),
    },
  );
  const { activity } = data ?? {};

  const {
    data: checkRecords,
    isLoading: isLoadingCheckRecords,
    refetch: refetchCheckRecords,
  } = api.volunteerActivity.getActivityCheckRecords.useQuery({
    activityId: Number(id),
  });

  const modifyCheckRecordDialogRef = useRef<HTMLDialogElement>(null);
  const [modifyRecord, setModifyRecord] = useState<CheckRecord | undefined>(
    undefined,
  );

  const [manualRegisterDialogOpen, setManualRegisterDialogOpen] =
    useState(false);

  const {
    mutate: modifyActivityCheckRecord,
    isLoading: modifyActivityCheckRecordIsLoading,
    error: modifyActivityCheckRecordError,
  } = api.volunteerActivity.modifyActivityCheckRecord.useMutation({
    onSuccess: () => {
      void refetchCheckRecords();
      modifyCheckRecordDialogRef.current?.close();
    },
  });

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading || isLoadingCheckRecords)
    return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/volunteer/activity/detail/${activity.id}`}>
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
      <ModifyCheckRecordDialog
        ref={modifyCheckRecordDialogRef}
        userName={modifyRecord?.userName ?? ""}
        defaultCheckInAt={modifyRecord?.checkInAt}
        defaultCheckOutAt={modifyRecord?.checkOutAt}
        onConfirm={(checkInAt, checkOutAt) => {
          modifyActivityCheckRecord({
            activityId: activity.id,
            userId: modifyRecord?.userId ?? "",
            checkInAt: checkInAt,
            checkOutAt: checkOutAt,
          });
        }}
        isLoading={modifyActivityCheckRecordIsLoading}
        error={modifyActivityCheckRecordError?.message}
      />
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
            <tr key={record.userId}>
              <td>{record.userName}</td>
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
                      modifyCheckRecordDialogRef.current?.showModal();
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
