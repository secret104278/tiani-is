import {
  ArrowDownOnSquareIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  QueueListIcon,
  TrashIcon,
  UserGroupIcon,
  UserMinusIcon,
} from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import EtogetherActivityCheckInDialogContent from "~/components/DialogContent/CheckIn/EtogetherActivityCheckInDialogContent";
import EtogetherActivityRegisterDialogContent from "~/components/DialogContent/EtogetherActivityRegisterDialogContent";
import { AlertWarning } from "~/components/utils/Alert";
import ConfirmDialog from "~/components/utils/ConfirmDialog";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { useSiteContext } from "~/context/SiteContext";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import type { OGMetaProps } from "~/utils/types";

import {
  activityIsEnded,
  activityIsStarted,
  formatDateTime,
  formatDateTitle,
  getActivityStatusText,
  toDuration,
} from "~/utils/ui";

export const getServerSideProps: GetServerSideProps<{
  ogMeta: OGMetaProps;
}> = async (context) => {
  const res = await db.etogetherActivity.findUnique({
    select: {
      title: true,
      startDateTime: true,
    },
    where: { id: Number(context.query.id) },
  });

  if (isNil(res)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ogMeta: {
        ogTitle: `${res.title}・${formatDateTitle(
          res.startDateTime,
        )}・活動e起來`,
      },
    },
  };
};

export default function EtogetherActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { site } = useSiteContext();

  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.etogetherActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  const { data: checkRecordData, refetch: refetchCheckRecordData } =
    api.etogetherActivity.getCheckRecord.useQuery({
      activityId: Number(id),
    });
  const alreadyCheckIn = !isNil(checkRecordData?.checkRecord);

  const { data: registerData, refetch: refetchRegisterData } =
    api.etogetherActivity.getRegister.useQuery({
      activityId: Number(id),
    });
  const alreadyRegister = !isNil(registerData);

  const [shareBtnLoading, setShareBtnLoading] = useState(false);

  const {
    mutate: deleteActivity,
    isPending: deleteActivityIsPending,
    isError: deleteActivityIsError,
  } = api.etogetherActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/${site}`),
  });

  const {
    mutate: unregisterActivity,
    isPending: unregisterActivityIsPending,
    error: unregisterActivityError,
  } = api.etogetherActivity.unregisterActivity.useMutation({
    onSuccess: () => refetchRegisterData(),
  });

  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  if (!isNil(activityError))
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (activityIsLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到活動</AlertWarning>;
  if (sessionStatus === "loading") return <div className="loading"></div>;
  if (isNil(session)) return <AlertWarning>請先登入</AlertWarning>;

  const isManager =
    !!session.user.role.is_etogether_admin ||
    session.user.id === activity.organiserId;

  const isEnded = activityIsEnded(activity.endDateTime);

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/etogether/activity/detail/${activity.id}?v=${activity.version}`,
        )}`}
        target="_blank"
      >
        <ReactiveButton
          className="btn bg-green-500"
          onClick={() => setShareBtnLoading(true)}
          loading={shareBtnLoading}
        >
          分享至Line
        </ReactiveButton>
      </a>
    );
  };

  const FlowControl = () => {
    if (activity.status === "PUBLISHED") return <ShareLineBtn />;
  };

  const AdminPanel = () => (
    <>
      <div className="divider">活動管理</div>
      <div className="flex flex-row justify-end">
        <div className="badge badge-primary">
          {getActivityStatusText(activity.status)}
        </div>
      </div>
      <div className="flex flex-row space-x-2">
        {!isEnded && <FlowControl />}
        <div className="grow" />
        <Link href={`/etogether/activity/edit/${activity.id}`}>
          <button className="btn">
            <PencilSquareIcon className="h-4 w-4" />
            編輯
          </button>
        </Link>
        <ReactiveButton
          className="btn btn-warning"
          loading={deleteActivityIsPending}
          isError={deleteActivityIsError}
          onClick={() => setDeleteDialogOpen(true)}
        >
          <TrashIcon className="h-4 w-4" />
          撤銷
        </ReactiveButton>
        <ConfirmDialog
          show={deleteDialogOpen}
          closeModal={() => setDeleteDialogOpen(false)}
          title="確認撤銷"
          content="活動撤銷後就無法復原囉！"
          confirmText="撤銷"
          onConfirm={() => deleteActivity({ activityId: activity.id })}
        />
      </div>
      <Link href={`/etogether/activity/registration/${activity.id}`}>
        <button className="btn w-full">
          <QueueListIcon className="h-4 w-4" />
          報名名單
        </button>
      </Link>
      <div className="divider" />
    </>
  );

  const RegisterControl = () => {
    return (
      <>
        {alreadyRegister && (
          <div className="card card-bordered card-compact shadow-sm">
            <div className="card-body">
              <p className="font-bold">我的報名表</p>
              <p>
                {session.user.name}：{registerData.subgroup.title}
              </p>
              {registerData.externalRegisters.map((r) => (
                <p key={r.id}>
                  {r.username}：{r.subgroup.title}
                </p>
              ))}
              {!alreadyCheckIn && (
                <div className="card-actions justify-end">
                  <ReactiveButton
                    className="btn"
                    onClick={() => setRegisterDialogOpen(true)}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    修改報名
                  </ReactiveButton>
                  <ReactiveButton
                    className="btn btn-error"
                    onClick={() => setLeaveDialogOpen(true)}
                    loading={unregisterActivityIsPending}
                    error={unregisterActivityError?.message}
                  >
                    <UserMinusIcon className="h-4 w-4" />
                    取消報名
                  </ReactiveButton>
                  <ConfirmDialog
                    show={leaveDialogOpen}
                    closeModal={() => setLeaveDialogOpen(false)}
                    title="取消報名"
                    content="確定要取消報名嗎？"
                    onConfirm={() =>
                      unregisterActivity({ activityId: activity.id })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {!alreadyRegister && (
          <ReactiveButton
            className="btn btn-accent"
            onClick={() => setRegisterDialogOpen(true)}
          >
            <ArrowDownOnSquareIcon className="h-4 w-4" />
            報名
          </ReactiveButton>
        )}
        <Dialog
          title={`${activity.title} 報名`}
          show={registerDialogOpen}
          closeModal={() => setRegisterDialogOpen(false)}
        >
          <EtogetherActivityRegisterDialogContent
            user={session.user}
            activityId={activity.id}
            subgroups={activity.subgroups}
            defaultValues={alreadyRegister ? registerData : undefined}
          />
        </Dialog>
      </>
    );
  };

  const CheckInControl = () => {
    if (!alreadyRegister) return null;

    const isActivityNotYetForCheck = !activityIsStarted(activity.startDateTime);
    const isActivityClosedForCheck = activityIsEnded(activity.endDateTime);

    let checkButtonLabel = "簽到";
    if (alreadyCheckIn) checkButtonLabel = "已完成簽到";
    else if (isActivityNotYetForCheck)
      checkButtonLabel = "活動開始前 1 小時開放簽到";
    else if (isActivityClosedForCheck) checkButtonLabel = "活動已結束";

    return (
      <>
        <ReactiveButton
          className="btn btn-accent"
          disabled={
            isActivityNotYetForCheck ||
            isActivityClosedForCheck ||
            alreadyCheckIn
          }
          onClick={() => setCheckInDialogOpen(true)}
        >
          <ArrowDownOnSquareIcon className="h-4 w-4" />
          {checkButtonLabel}
        </ReactiveButton>
        <Dialog
          title="定位打卡"
          show={checkInDialogOpen}
          closeModal={() => setCheckInDialogOpen(false)}
        >
          <EtogetherActivityCheckInDialogContent
            activityId={activity.id}
            onCheckInSuccess={() => void refetchCheckRecordData()}
          />
        </Dialog>
      </>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <div className="flex items-center justify-end space-x-4">
        {!isManager && <ShareLineBtn />}
      </div>

      {isManager && <AdminPanel />}
      <div className="flex flex-col space-y-2 align-bottom">
        <p>發起人：{activity.organiser.name}</p>

        <div className="flex items-center">
          <MapPinIcon className="mr-1 h-4 w-4" />
          <p>地點：{activity.location}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>開始：{formatDateTime(activity.startDateTime)}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>
            時數：
            {toDuration(activity.startDateTime, activity.endDateTime)}
          </p>
        </div>
        <div className="flex items-center">
          <UserGroupIcon className="mr-1 h-4 w-4" />
          <p>分組：</p>
        </div>
        {activity.subgroups.map((subgroup) => (
          <div
            key={subgroup.id}
            className={`card card-bordered card-compact ml-4 shadow-sm`}
            style={
              !isNil(subgroup.displayColorCode)
                ? {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    backgroundColor: subgroup.displayColorCode,
                  }
                : undefined
            }
          >
            <div className="card-body">
              <h5 className="card-title">{subgroup.title}</h5>
              <article className="prose hyphens-auto whitespace-break-spaces break-words py-4">
                {subgroup.description}
              </article>
            </div>
          </div>
        ))}
        <article className="prose hyphens-auto whitespace-break-spaces break-words py-4">
          {activity.description}
        </article>
        <RegisterControl />
        <CheckInControl />
      </div>
    </div>
  );
}
