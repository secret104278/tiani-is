import { PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty, isNil } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import ModifyCheckRecordDialogContent from "~/components/DialogContent/ModifyCheckRecordDialogContent";
import { HourStats } from "~/components/HourStats";

import WorkingStatsPanel from "~/components/WorkingStatsPanel";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";

export default function AdminCasualUserEdit() {
  const router = useRouter();
  const { userId } = router.query;

  const [
    modifyCasualCheckRecordDialogOpen,
    setModifyCasualCheckRecordDialogOpen,
  ] = useState(false);
  const [casualCheckRecord, setCasualCheckRecord] = useState<
    { id: number; checkInAt: Date; checkOutAt: Date | null } | undefined
  >(undefined);

  const [
    modifyActivityCheckRecordDialogOpen,
    setModifyActivityCheckRecordDialogOpen,
  ] = useState(false);
  const [activityCheckRecord, setActivityCheckRecord] = useState<
    { activityId: number; checkInAt: Date; checkOutAt: Date | null } | undefined
  >(undefined);

  const [manualCheckRecordDialogOpen, setManualCheckRecordDialogOpen] =
    useState(false);

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
      setModifyCasualCheckRecordDialogOpen(false);
    },
  });

  const {
    mutate: managerCheckInActivity,
    isLoading: managerCheckInActivityIsLoading,
    error: managerCheckInActivityError,
  } = api.volunteerActivity.managerCheckInActivity.useMutation({
    onSuccess: () => {
      void refetchWorkingStats();
      setModifyActivityCheckRecordDialogOpen(false);
    },
  });

  const {
    mutate: manualCasualCheckRecord,
    isLoading: manualCasualCheckRecordIsLoading,
    error: manualCasualCheckRecordError,
  } = api.volunteerActivity.manualCasualCheckRecord.useMutation({
    onSuccess: () => {
      void refetchWorkingStats();
      setManualCheckRecordDialogOpen(false);
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
          onClick={() => setManualCheckRecordDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          手動日常打卡
        </ReactiveButton>
        <Dialog
          title="補正紀錄"
          show={manualCheckRecordDialogOpen}
          closeModal={() => setManualCheckRecordDialogOpen(false)}
        >
          <ModifyCheckRecordDialogContent
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
        </Dialog>
      </div>

      <Dialog
        title="補正紀錄"
        show={modifyCasualCheckRecordDialogOpen}
        closeModal={() => setModifyCasualCheckRecordDialogOpen(false)}
      >
        <ModifyCheckRecordDialogContent
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
      </Dialog>
      <Dialog
        title="補正紀錄"
        show={modifyActivityCheckRecordDialogOpen}
        closeModal={() => setModifyActivityCheckRecordDialogOpen(false)}
      >
        <ModifyCheckRecordDialogContent
          userName={user.name ?? ""}
          defaultCheckInAt={activityCheckRecord?.checkInAt}
          defaultCheckOutAt={activityCheckRecord?.checkOutAt ?? undefined}
          onConfirm={(checkInAt, checkOutAt) => {
            activityCheckRecord &&
              managerCheckInActivity({
                activityId: activityCheckRecord.activityId,
                userId: user.id,
                checkInAt: checkInAt,
                checkOutAt: checkOutAt,
              });
          }}
          isLoading={managerCheckInActivityIsLoading}
          error={managerCheckInActivityError?.message}
        />
      </Dialog>

      <HourStats
        title="總服務小時"
        totalWorkingHours={workingStats?.totalWorkingHours}
      />
      {workingStats && (
        <WorkingStatsPanel
          workingStats={workingStats}
          isAdmin
          onModifyCasualCheckRecord={(history) => {
            setCasualCheckRecord(history);
            setModifyCasualCheckRecordDialogOpen(true);
          }}
          onModifyActivityCheckRecord={(history) => {
            setActivityCheckRecord(history);
            setModifyActivityCheckRecordDialogOpen(true);
          }}
        />
      )}
    </div>
  );
}
