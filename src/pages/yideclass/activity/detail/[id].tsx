import {
  ArrowDownOnSquareIcon,
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
import { AlertWarning } from "~/components/Alert";
import ClassActivityCheckInDialogContent from "~/components/CheckInDialog/ClassActivityCheckInDialogContent";
import ReactiveButton from "~/components/ReactiveButton";
import ConfirmDialog from "~/components/utils/ConfirmDialog";
import Dialog from "~/components/utils/Dialog";
import { useSiteContext } from "~/context/SiteContext";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import type { OGMetaProps } from "~/utils/types";

import {
  CLASS_ACTIVITY_LOCATION_MAP,
  activityIsEnded,
  activityIsStarted,
  getActivityStatusText,
} from "~/utils/ui";

export const getServerSideProps: GetServerSideProps<{
  ogMeta: OGMetaProps;
}> = async (context) => {
  const res = await db.classActivity.findFirst({
    select: {
      title: true,
      startDateTime: true,
    },
    where: { id: Number(context.query.id) },
  });
  let dateString = "";
  if (!isNil(res)) {
    // since the server my run in different location,
    // and the timestamp is stored in DB is in UTC,
    // so convert it to Asia/Taipei when server side rendering
    const d = new Date(
      res.startDateTime.toLocaleString("en-US", { timeZone: "Asia/Taipei" }),
    );
    dateString = `${d.getMonth() + 1}月${d.getDate()}日 ${d
      .getHours()
      .toString()
      .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  return {
    props: {
      ogMeta: {
        ogTitle: `${res?.title}・${dateString}・義德班務網`,
      },
    },
  };
};

export default function ClassActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { site } = useSiteContext();

  const { data: session } = useSession();

  const { data, isLoading, error } = api.classActivity.getActivity.useQuery({
    id: Number(id),
  });

  const { activity } = data ?? {};

  const { data: checkInData, refetch: refetchCheckInData } =
    api.classActivity.getCheckInActivityHistory.useQuery({
      activityId: Number(id),
    });

  const [shareBtnLoading, setShareBtnLoading] = useState(false);

  const {
    mutate: deleteActivity,
    isLoading: deleteActivityIsLoading,
    isError: deleteActivityIsError,
  } = api.classActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/${site}`),
  });

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  const isManager =
    session?.user.role.is_yideclass_admin ??
    session?.user.id == activity.organiserId;

  const isEnded = activityIsEnded(activity.endDateTime);

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/yideclass/activity/detail/${activity.id}?v=${activity.version}`,
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
      <div className="divider">課程管理</div>
      <div className="flex flex-row justify-end">
        <div className="badge badge-primary">
          {getActivityStatusText(activity.status)}
        </div>
      </div>
      <div className="flex flex-row space-x-2">
        {!isEnded && <FlowControl />}
        <div className="grow" />
        <Link href={`/yideclass/activity/edit/${activity.id}`}>
          <button className="btn">
            <PencilSquareIcon className="h-4 w-4" />
            編輯
          </button>
        </Link>
        <ReactiveButton
          className="btn btn-warning"
          loading={deleteActivityIsLoading}
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
          onConfirm={() => deleteActivity({ id: activity.id })}
        />
      </div>

      <Link href={`/yideclass/activity/checkrecord/${activity.id}`}>
        <button className="btn w-full">
          <QueueListIcon className="h-4 w-4" />
          打卡名單
        </button>
      </Link>
      <div className="divider" />
    </>
  );

  const CheckInControl = () => {
    const alreadyCheckIn = !isNil(checkInData);

    const isActivityNotYetForCheck = !activityIsStarted(activity.startDateTime);
    const isActivityClosedForCheck = activityIsEnded(activity.endDateTime);

    let checkButtonLabel = "";
    if (alreadyCheckIn) checkButtonLabel = " （已完成簽到）";
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
            onCheckInSuccess={() => void refetchCheckInData()}
          />
        </Dialog>
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
      <div className="flex flex-col space-y-2 align-bottom">
        <p>壇務：{activity.organiser.name}</p>

        <div className="flex items-center">
          <MapPinIcon className="mr-1 h-4 w-4" />
          <p>地點：{activity.location}</p>
        </div>
        <LocationAddress />
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>開始：{activity.startDateTime.toLocaleString()}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>結束：{activity.endDateTime.toLocaleString()}</p>
        </div>
        <article className="prose hyphens-auto whitespace-break-spaces break-words py-4">
          {activity.description}
        </article>
        <CheckInControl />
      </div>
    </div>
  );
}
