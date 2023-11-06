import {
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  BellAlertIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  QueueListIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { AlertWarning } from "~/components/Alert";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import LineImage from "~/components/LineImage";
import ReactiveButton from "~/components/ReactiveButton";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import type { OGMetaProps } from "~/utils/types";

import { formatMilliseconds, getActivityStatusText } from "~/utils/ui";

const ActivityCheckInDialog = dynamic(
  () => import("~/components/ActivityCheckInDialog"),
  {
    ssr: false,
  },
);

export const getServerSideProps: GetServerSideProps<{
  ogMeta: OGMetaProps;
}> = async (context) => {
  const res = await db.volunteerActivity.findFirst({
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
        ogTitle: `${res?.title}・${dateString}・天一志工隊`,
        ogDescription: `有新的志工工作需要協助，快來報名吧！`,
      },
    },
  };
};

export default function VolunteerActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: session } = useSession();

  const { data, isLoading, error, refetch } =
    api.volunteerActivity.getActivity.useQuery({
      id: Number(id),
    });

  const { activity, isParticipant } = data ?? {};

  const { data: checkInData, refetch: refetchCheckInData } =
    api.volunteerActivity.getCheckInActivityHistory.useQuery({
      activityId: Number(id),
    });

  const {
    mutate: submitActivityForReview,
    isLoading: submitActivityForReviewIsLoading,
  } = api.volunteerActivity.submitActivityForReview.useMutation({
    onSettled: () => refetch(),
  });

  const {
    mutate: sendReviewNotification,
    isLoading: sendReviewNotificationIsLoading,
    isSuccess: sendReviewNotificationIsSuccess,
    isError: sendReviewNotificationIsError,
  } = api.volunteerActivity.sendReviewNotification.useMutation();

  const { mutate: approveActivity, isLoading: approveActivityIsLoading } =
    api.volunteerActivity.approveActivity.useMutation({
      onSettled: () => refetch(),
    });

  const [shareBtnLoading, setShareBtnLoading] = useState(false);

  // const {
  //   mutate: sendActivityAdvertisement,
  //   isLoading: sendActivityAdvertisementIsLoading,
  //   isSuccess: sendActivityAdvertisementIsSuccess,
  //   isError: sendActivityAdvertisementIsError,
  // } = api.volunteerActivity.sendActivityAdvertisement.useMutation();

  const {
    mutate: deleteActivity,
    isLoading: deleteActivityIsLoading,
    isError: deleteActivityIsError,
  } = api.volunteerActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/`),
  });

  const {
    mutate: participateActivity,
    isLoading: participateActivityIsLoading,
    isError: participateActivityIsError,
  } = api.volunteerActivity.participateActivity.useMutation({
    onSuccess: () => refetch(),
  });

  const {
    mutate: leaveActivity,
    isLoading: leaveActivityIsLoading,
    isError: leaveActivityIsError,
  } = api.volunteerActivity.leaveActivity.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  const leaveDialogRef = useRef<HTMLDialogElement>(null);

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  const isManager =
    session?.user.role === "ADMIN" || session?.user.id == activity.organiserId;

  const isEnded = activity.endDateTime <= new Date();

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/volunteer/activity/detail/${activity.id}?v=${activity.version}`,
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

  const ParticipantsCollapse = () => {
    // use form here to prevent from re-rendering on first click
    return (
      <form className="collapse collapse-arrow bg-base-200">
        <input type="checkbox" />
        <div className="collapse-title font-medium">
          目前有 {activity.participants?.length || 0} 人報名
        </div>
        <div className="collapse-content">
          <ul className="space-y-2">
            {activity.participants.map((participant) => (
              <li key={participant.id} className="flex items-center">
                {participant.image ? (
                  <div className="avatar mr-2">
                    <div className="w-8 rounded-full">
                      <LineImage
                        src={participant.image}
                        alt={participant.name ?? ""}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="avatar placeholder mr-2">
                    <div className="w-8 rounded-full bg-neutral-focus text-neutral-content">
                      <span>{participant.name?.charAt(0)}</span>
                    </div>
                  </div>
                )}
                {participant.name}
              </li>
            ))}
          </ul>
        </div>
      </form>
    );
  };

  const FlowControl = () => {
    if (activity.status === "DRAFT")
      return (
        <ReactiveButton
          className="btn"
          onClick={() => submitActivityForReview({ activityId: activity.id })}
          loading={submitActivityForReviewIsLoading}
        >
          送出申請
        </ReactiveButton>
      );

    if (activity.status === "INREVIEW") {
      if (session?.user.role === "USER")
        return (
          <ReactiveButton
            className="btn"
            loading={sendReviewNotificationIsLoading}
            isSuccess={sendReviewNotificationIsSuccess}
            isError={sendReviewNotificationIsError}
            onClick={() => sendReviewNotification({ activityId: activity.id })}
          >
            <BellAlertIcon className="h-4 w-4" />
            提醒審核
          </ReactiveButton>
        );

      if (session?.user.role === "ADMIN")
        return (
          <ReactiveButton
            className="btn"
            loading={approveActivityIsLoading}
            onClick={() => approveActivity({ activityId: activity.id })}
          >
            核准
          </ReactiveButton>
        );
    }

    if (activity.status === "PUBLISHED") return <ShareLineBtn />;
  };

  const AdminPanel = () => (
    <>
      <div className="divider">工作管理</div>
      <div className="flex flex-row justify-end">
        <div className="badge badge-primary">
          {getActivityStatusText(activity.status)}
        </div>
      </div>
      <div className="flex flex-row space-x-2">
        {!isEnded && <FlowControl />}
        <div className="grow" />
        <Link href={`/volunteer/activity/edit/${activity.id}`}>
          <button className="btn">
            <PencilSquareIcon className="h-4 w-4" />
            編輯
          </button>
        </Link>
        <ReactiveButton
          className="btn btn-warning"
          loading={deleteActivityIsLoading}
          isError={deleteActivityIsError}
          onClick={() => void deleteDialogRef.current?.showModal()}
        >
          <TrashIcon className="h-4 w-4" />
          撤銷
        </ReactiveButton>
        <ConfirmDialog
          title="確認撤銷"
          content="工作撤銷後就無法復原囉！"
          confirmText="撤銷"
          onConfirm={() => deleteActivity({ id: activity.id })}
          ref={deleteDialogRef}
        />
      </div>
      <ParticipantsCollapse />
      <Link href={`/volunteer/activity/checkrecord/${activity.id}`}>
        <button className="btn w-full">
          <QueueListIcon className="h-4 w-4" />
          打卡名單
        </button>
      </Link>
      <div className="divider" />
    </>
  );

  const ParticipateControl = () => {
    if (isEnded)
      return (
        <button className="btn btn-disabled">
          <UserPlusIcon className="h-4 w-4" />
          已結束
        </button>
      );

    if (isParticipant)
      return (
        <>
          <ReactiveButton
            className="btn btn-secondary"
            onClick={() => void leaveDialogRef.current?.showModal()}
            loading={leaveActivityIsLoading}
            isError={leaveActivityIsError}
          >
            <UserPlusIcon className="h-4 w-4" />
            取消報名
          </ReactiveButton>
          <ConfirmDialog
            title="取消報名"
            content="確定要取消報名嗎？"
            onConfirm={() => leaveActivity({ activityId: activity.id })}
            ref={leaveDialogRef}
          />
        </>
      );

    if (activity.participants.length >= activity.headcount)
      return (
        <button className="btn btn-disabled">
          <UserPlusIcon className="h-4 w-4" />
          人數已滿
        </button>
      );

    return (
      <ReactiveButton
        className="btn btn-accent"
        onClick={() => participateActivity({ activityId: activity.id })}
        loading={participateActivityIsLoading}
        isError={participateActivityIsError}
      >
        <UserPlusIcon className="h-4 w-4" />
        報名
      </ReactiveButton>
    );
  };

  const CheckInControl = () => {
    const isCheckIn = isNil(checkInData);
    const alreadyCheckOut = !isNil(checkInData?.checkout?.checkAt);

    const isActivityNotYetForCheck =
      new Date().getTime() <=
      activity.startDateTime.getTime() - 2 * 60 * 60 * 1000;
    const isActivityClosedForCheck =
      new Date().getTime() >=
      activity.endDateTime.getTime() + 2 * 60 * 60 * 1000;

    let checkButtonLabel = "";
    if (isActivityNotYetForCheck)
      checkButtonLabel = " （工作開始前 2 小時開放打卡）";
    if (isActivityClosedForCheck) checkButtonLabel = " （工作已結束）";
    if (alreadyCheckOut)
      checkButtonLabel = ` （已工作 ${formatMilliseconds(
        checkInData!.checkout!.checkAt.getTime() -
          checkInData!.checkin.checkAt.getTime(),
      )}）`;

    if (isCheckIn) checkButtonLabel = `簽到${checkButtonLabel}`;
    else checkButtonLabel = `簽退${checkButtonLabel}`;

    if (isParticipant)
      return (
        <>
          <ReactiveButton
            className="btn btn-accent"
            disabled={isActivityNotYetForCheck || isActivityClosedForCheck}
            onClick={() => setCheckInDialogOpen(true)}
          >
            {isCheckIn ? (
              <ArrowDownOnSquareIcon className="h-4 w-4" />
            ) : (
              <ArrowUpOnSquareIcon className="h-4 w-4" />
            )}
            {checkButtonLabel}
          </ReactiveButton>
          <ActivityCheckInDialog
            activityId={activity.id}
            open={checkInDialogOpen}
            onClose={() => setCheckInDialogOpen(false)}
            onCheckInSuccess={() => void refetchCheckInData()}
          />
        </>
      );
  };

  // Fetch and display the details of the book with the given ID
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <div className="flex items-center justify-end space-x-4">
        {isParticipant && <div className="badge badge-neutral">已報名</div>}
        {!isManager && <ShareLineBtn />}
      </div>
      {!isManager && isParticipant && <ParticipantsCollapse />}
      {isManager && <AdminPanel />}
      <div className="flex flex-col space-y-2 align-bottom">
        <p>發起人：{activity.organiser.name}</p>
        <div className="flex items-center">
          <UsersIcon className="mr-1 h-4 w-4" />
          <p>人數：{activity.headcount} 人</p>
        </div>
        <div className="flex items-center">
          <MapPinIcon className="mr-1 h-4 w-4" />
          <p>地點：{activity.location}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>開始：{activity.startDateTime.toLocaleString()}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>結束：{activity.endDateTime.toLocaleString()}</p>
        </div>
        <article className="prose">{activity.description}</article>
        <ParticipateControl />
        <CheckInControl />
      </div>
    </div>
  );
}