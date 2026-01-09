import {
  ArrowDownOnSquareIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  MapIcon,
  MapPinIcon,
  PencilSquareIcon,
  QueueListIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import ClassActivityCheckInDialogContent from "~/components/DialogContent/CheckIn/ClassActivityCheckInDialogContent";
import { AlertWarning } from "~/components/utils/Alert";
import ConfirmDialog from "~/components/utils/ConfirmDialog";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { useSiteContext } from "~/context/SiteContext";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import type { OGMetaProps } from "~/utils/types";

import {
  CLASS_ACTIVITY_LOCATION_MAP,
  activityIsEnded,
  activityIsStarted,
  formatDateTime,
  formatDateTitle,
  getActivityStatusText,
  getUnitByName,
  toDuration,
} from "~/utils/ui";

export const getServerSideProps: GetServerSideProps<{
  ogMeta: OGMetaProps;
}> = async (context) => {
  const res = await db.classActivity.findUnique({
    where: { id: Number(context.query.id) },
    include: { organiser: true },
  });

  if (isNil(res)) {
    return {
      notFound: true,
    };
  }

  // @ts-ignore
  const unit = res.unit ?? "義德";

  return {
    props: {
      ogMeta: {
        ogTitle: `${res.title}・${formatDateTitle(
          res.startDateTime,
        )}・${unit}班務網`,
      },
    },
  };
};

export default function ClassActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { site } = useSiteContext();

  const { data: session } = useSession();

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.classActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  const { data: isCheckedIn, refetch: refetchIsCheckedIn } =
    api.classActivity.isCheckedIn.useQuery({
      activityId: Number(id),
    });

  const {
    data: isLeaved,
    isLoading: isLeavedIsLoading,
    error: isLeavedError,
  } = api.classActivity.isLeaved.useQuery({
    activityId: Number(id),
  });

  const [shareBtnLoading, setShareBtnLoading] = useState(false);

  const {
    mutate: deleteActivity,
    isPending: deleteActivityIsPending,
    isError: deleteActivityIsError,
  } = api.classActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/${site}`),
  });

  const {
    mutate: takeLeave,
    isPending: takeLeaveIsPending,
    error: takeLeaveError,
  } = api.classActivity.takeLeave.useMutation({
    onSuccess: () => router.reload(),
  });

  const {
    mutate: cancelLeave,
    isPending: cancelLeaveIsPending,
    error: cancelLeaveError,
  } = api.classActivity.cancelLeave.useMutation({
    onSuccess: () => router.reload(),
  });

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  if (!isNil(activityError))
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (activityIsLoading) return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  const isManager =
    !!session?.user.role.is_class_admin ||
    session?.user.id === activity.organiserId;

  const isEnded = activityIsEnded(activity.endDateTime);
  // @ts-ignore
  const unitInfo = getUnitByName(activity.unit ?? "義德");

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/class/activity/detail/${activity.id}?v=${activity.version}&unit=${unitInfo?.slug}`,
        )}`}
        target="_blank"
        rel="noreferrer"
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

  // @ts-ignore
  const unitName = activity.unit ?? "義德";

  const AdminPanel = () => (
    <>
      <div className="divider">{unitName}班務管理</div>
      <div className="flex flex-row justify-end">
        <div className="badge badge-primary">
          {getActivityStatusText(activity.status)}
        </div>
      </div>
      <div className="flex flex-row space-x-2">
        {!isEnded && <FlowControl />}
        <div className="grow" />
        <Link href={`/class/activity/edit/${activity.id}`}>
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
          content="課程撤銷後就無法復原囉！"
          confirmText="撤銷"
          onConfirm={() => deleteActivity({ activityId: activity.id })}
        />
      </div>

      <Link href={`/class/activity/checkrecord/${activity.id}`}>
        <button className="btn w-full">
          <QueueListIcon className="h-4 w-4" />
          打卡名單
        </button>
      </Link>
      <Link href={`/class/activity/leaverecord/${activity.id}`}>
        <button className="btn w-full">
          <QueueListIcon className="h-4 w-4" />
          請假名單
        </button>
      </Link>
      <Link href={`/class/activity/absent/${activity.id}`}>
        <button className="btn w-full">
          <QueueListIcon className="h-4 w-4" />
          缺席名單
        </button>
      </Link>
      <div className="divider" />
    </>
  );

  const CheckInControl = () => {
    const isActivityNotYetForCheck = !activityIsStarted(activity.startDateTime);
    const isActivityClosedForCheck = activityIsEnded(activity.endDateTime);

    let checkButtonLabel = "";
    if (isCheckedIn) checkButtonLabel = " （已完成簽到）";
    else if (isActivityNotYetForCheck)
      checkButtonLabel = " （課程開始前 1 小時開放打卡）";
    else if (isActivityClosedForCheck) checkButtonLabel = " （課程已結束）";

    checkButtonLabel = `簽到${checkButtonLabel}`;

    return (
      <>
        <ReactiveButton
          className="btn btn-accent"
          disabled={isActivityNotYetForCheck || isActivityClosedForCheck}
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
          <ClassActivityCheckInDialogContent
            activityId={activity.id}
            onCheckInSuccess={() => void refetchIsCheckedIn()}
          />
        </Dialog>
      </>
    );
  };

  const LeaveControl = () => {
    if (isLeavedIsLoading) return <div className="loading" />;
    if (!isNil(isLeavedError))
      return <AlertWarning>{isLeavedError.message}</AlertWarning>;

    if (isLeaved)
      return (
        <ReactiveButton
          className="btn btn-secondary"
          onClick={() => cancelLeave({ activityId: activity.id })}
          disabled={isEnded}
          loading={cancelLeaveIsPending}
          error={cancelLeaveError?.message}
        >
          取消請假
        </ReactiveButton>
      );

    return (
      <>
        <ReactiveButton
          className="btn btn-secondary"
          onClick={() => setLeaveDialogOpen(true)}
          disabled={isEnded}
          loading={takeLeaveIsPending}
          error={takeLeaveError?.message}
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          請假
        </ReactiveButton>
        <ConfirmDialog
          show={leaveDialogOpen}
          closeModal={() => setLeaveDialogOpen(false)}
          title="確認請假"
          content={
            <article className="prose">
              <span className="font-bold">
                {formatDateTime(activity.startDateTime)}
                <br />
                <span className="text-lg">{activity.title}</span>
              </span>
              <br />
              是否確定要請假？
            </article>
          }
          confirmText="請假"
          onConfirm={() => takeLeave({ activityId: activity.id })}
        />
      </>
    );
  };

  const LocationAddress = () => {
    const location = CLASS_ACTIVITY_LOCATION_MAP.get(activity.location);
    if (isNil(location)) return null;
    return (
      <div className="flex items-center">
        <MapIcon className="mr-1 h-4 w-4" />
        <a
          target="_blank"
          href={`https://maps.google.com/?q=@${location.gps[0]},${location.gps[1]}`}
          rel="noreferrer"
        >
          地址：<a className="link">{location.address}</a>
        </a>
      </div>
    );
  };

  // Fetch and display the details of the book with the given ID
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <div className="flex items-center justify-end space-x-4">
        {!isManager && <ShareLineBtn />}
      </div>

      {isManager && <AdminPanel />}

      <CheckInControl />
      <LeaveControl />

      <div className="flex flex-col space-y-2 align-bottom">
        <p>壇務：{activity.organiser.name}</p>

        <div className="flex items-center">
          <MapPinIcon className="mr-1 h-4 w-4" />
          <p>地點：{activity.location}</p>
        </div>
        <LocationAddress />
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>開始：{formatDateTime(activity.startDateTime)}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>
            開班時數：
            {toDuration(activity.startDateTime, activity.endDateTime)}
          </p>
        </div>
        <article className="prose hyphens-auto whitespace-break-spaces break-words py-4">
          {activity.description}
        </article>
      </div>
    </div>
  );
}
