import { PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty, isNil } from "lodash";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { AlertWarning } from "~/components/Alert";
import { ModifyCheckRecordDialog } from "~/components/ModifyCheckRecordDialog";
import ReactiveButton from "~/components/ReactiveButton";
import WorkingStatsPanel from "~/components/WorkingStatsPanel";
import { api } from "~/utils/api";

export default function AdminCasualUserEdit() {
  const router = useRouter();
  const { userId } = router.query;

  const modifyCasualCheckRecordDialogRef = useRef<HTMLDialogElement>(null);
  const [casualCheckRecord, setCasualCheckRecord] = useState<
    { id: number; checkInAt: Date; checkOutAt: Date | null } | undefined
  >(undefined);

  const modifyActivityCheckRecordDialogRef = useRef<HTMLDialogElement>(null);
  const [activityCheckRecord, setActivityCheckRecord] = useState<
    { activityId: number; checkInAt: Date; checkOutAt: Date | null } | undefined
  >(undefined);

  const manualCheckRecordDialogRef = useRef<HTMLDialogElement>(null);

  const {
    data: user,
    isLoading: userIsLoading,
    error: userError,
  } = api.user.getUser.useQuery({ userId: String(userId) });

  const {
    data: workingStats,
    isLoading: workingStatsIsLoading,
    error: workingStatsError,
    refetch: refetchWorkingStats,
  } = api.volunteerActivity.getWorkingStats.useQuery({
    userId: String(userId),
  });

  const {
    mutate: modifyCasualCheckRecord,
    isLoading: modifyCasualCheckRecordIsLoading,
    error: modifyCasualCheckRecordError,
  } = api.volunteerActivity.modifyCasualCheckRecord.useMutation({
    onSuccess: () => {
      void refetchWorkingStats();
      modifyCasualCheckRecordDialogRef.current?.close();
    },
  });

  const {
    mutate: modifyActivityCheckRecord,
    isLoading: modifyActivityCheckRecordIsLoading,
    error: modifyActivityCheckRecordError,
  } = api.volunteerActivity.modifyActivityCheckRecord.useMutation({
    onSuccess: () => {
      void refetchWorkingStats();
      modifyActivityCheckRecordDialogRef.current?.close();
    },
  });

  const {
    mutate: manualCasualCheckRecord,
    isLoading: manualCasualCheckRecordIsLoading,
    error: manualCasualCheckRecordError,
  } = api.volunteerActivity.manualCasualCheckRecord.useMutation({
    onSuccess: () => {
      void refetchWorkingStats();
      manualCheckRecordDialogRef.current?.close();
    },
  });

  if (workingStatsIsLoading || userIsLoading)
    return <div className="loading" />;
  if (!isEmpty(workingStatsError))
    return <AlertWarning>{workingStatsError.message}</AlertWarning>;
  if (!isEmpty(userError))
    return <AlertWarning>{userError.message}</AlertWarning>;
  if (isNil(user)) return <AlertWarning>查無此人</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <div className="link" onClick={() => router.back()}>
        ← 工作管理
      </div>
      <article className="prose">
        <h1>{user.name}</h1>
      </article>
      <div className="flex justify-end">
        <ReactiveButton
          className="btn"
          onClick={() => manualCheckRecordDialogRef.current?.showModal()}
        >
          <PlusIcon className="h-4 w-4" />
          手動日常打卡
        </ReactiveButton>
        <ModifyCheckRecordDialog
          ref={manualCheckRecordDialogRef}
          userName={user.name ?? ""}
          defaultCheckInAt={new Date()}
          onConfirm={(checkInAt, checkOutAt) => {
            manualCasualCheckRecord({
              userId: user.id,
              checkInAt: checkInAt,
              checkOutAt: checkOutAt,
            });
          }}
          isLoading={manualCasualCheckRecordIsLoading}
          error={manualCasualCheckRecordError?.message}
        />
      </div>
      <ModifyCheckRecordDialog
        ref={modifyCasualCheckRecordDialogRef}
        userName={user.name ?? ""}
        defaultCheckInAt={casualCheckRecord?.checkInAt}
        defaultCheckOutAt={casualCheckRecord?.checkOutAt ?? undefined}
        onConfirm={(checkInAt, checkOutAt) => {
          casualCheckRecord &&
            modifyCasualCheckRecord({
              id: casualCheckRecord.id,
              userId: user.id,
              checkInAt: checkInAt,
              checkOutAt: checkOutAt,
            });
        }}
        isLoading={modifyCasualCheckRecordIsLoading}
        error={modifyCasualCheckRecordError?.message}
      />

      <ModifyCheckRecordDialog
        ref={modifyActivityCheckRecordDialogRef}
        userName={user.name ?? ""}
        defaultCheckInAt={activityCheckRecord?.checkInAt}
        defaultCheckOutAt={activityCheckRecord?.checkOutAt ?? undefined}
        onConfirm={(checkInAt, checkOutAt) => {
          activityCheckRecord &&
            modifyActivityCheckRecord({
              activityId: activityCheckRecord.activityId,
              userId: user.id,
              checkInAt: checkInAt,
              checkOutAt: checkOutAt,
            });
        }}
        isLoading={modifyActivityCheckRecordIsLoading}
        error={modifyActivityCheckRecordError?.message}
      />
      {workingStats && (
        <WorkingStatsPanel
          workingStats={workingStats}
          isAdmin
          onModifyCasualCheckRecord={(history) => {
            setCasualCheckRecord(history);
            modifyCasualCheckRecordDialogRef.current?.showModal();
          }}
          onModifyActivityCheckRecord={(history) => {
            setActivityCheckRecord(history);
            modifyActivityCheckRecordDialogRef.current?.showModal();
          }}
        />
      )}
    </div>
  );
}
