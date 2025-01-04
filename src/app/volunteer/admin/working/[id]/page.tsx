"use client";

import { PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty, isNil } from "lodash";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import AlertWarning from "~/app/_components/basic/alert-warning";
import Dialog from "~/app/_components/basic/dialog";
import ReactiveButton from "~/app/_components/basic/reactive-button";
import HourStats from "~/app/_components/hour-stats";
import ModifyCheckRecordDialogContent from "~/app/volunteer/_components/modify-check-record-dialog-content";
import WorkingStatsPanel from "~/app/volunteer/_components/working-stats-panel";
import { api } from "~/trpc/react";
import { volunteerAdminWorkingHref } from "~/utils/navigation";

export default function AdminCasualUserEdit() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;

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
  } = api.appUser.getUser.useQuery({ userId: String(userId) });

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
    isPending: modifyCasualCheckRecordIsLoading,
    error: modifyCasualCheckRecordError,
  } = api.volunteerActivity.modifyCasualCheckRecord.useMutation({
    onSuccess: () => {
      void refetchWorkingStats();
      setModifyCasualCheckRecordDialogOpen(false);
    },
  });

  const {
    mutate: managerCheckInActivity,
    isPending: managerCheckInActivityIsLoading,
    error: managerCheckInActivityError,
  } = api.volunteerActivity.managerCheckInActivity.useMutation({
    onSuccess: () => {
      void refetchWorkingStats();
      setModifyActivityCheckRecordDialogOpen(false);
    },
  });

  const {
    mutate: manualCasualCheckRecord,
    isPending: manualCasualCheckRecordIsLoading,
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
      <Link className="link" href={volunteerAdminWorkingHref()}>
        ← 工作管理
      </Link>
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
            void (
              casualCheckRecord &&
              modifyCasualCheckRecord({
                id: casualCheckRecord.id,
                userId: user.id,
                checkInAt: checkInAt,
                checkOutAt: checkOutAt,
              })
            );
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
            void (
              activityCheckRecord &&
              managerCheckInActivity({
                activityId: activityCheckRecord.activityId,
                userId: user.id,
                checkInAt: checkInAt,
                checkOutAt: checkOutAt,
              })
            );
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
