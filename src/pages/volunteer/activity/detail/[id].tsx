import {
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  BellAlertIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  QueueListIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import VolunteerActivityCheckInDialogContent from "~/components/DialogContent/CheckIn/VolunteerActivityCheckInDialogContent";
import { AlertWarning } from "~/components/utils/Alert";
import ConfirmDialog from "~/components/utils/ConfirmDialog";
import Dialog from "~/components/utils/Dialog";
import LineImage from "~/components/utils/LineImage";
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
  formatMilliseconds,
  getActivityStatusText,
  toDuration,
} from "~/utils/ui";

export const getServerSideProps: GetServerSideProps<{
  ogMeta: OGMetaProps;
}> = async (context) => {
  const res = await db.volunteerActivity.findUnique({
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
        )}・天一志工隊`,
        ogDescription: "有新的志工工作需要協助，快來報名吧！",
      },
    },
  };
};

export default function VolunteerActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { site } = useSiteContext();

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
    isPending: submitActivityForReviewIsPending,
  } = api.volunteerActivity.submitActivityForReview.useMutation({
    onSettled: () => refetch(),
  });

  const {
    mutate: sendReviewNotification,
    isPending: sendReviewNotificationIsPending,
    isSuccess: sendReviewNotificationIsSuccess,
    isError: sendReviewNotificationIsError,
  } = api.volunteerActivity.sendReviewNotification.useMutation();

  const { mutate: approveActivity, isPending: approveActivityIsPending } =
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
    isPending: deleteActivityIsPending,
    isError: deleteActivityIsError,
  } = api.volunteerActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/${site}`),
  });

  const {
    mutate: participateActivity,
    isPending: participateActivityIsPending,
    isError: participateActivityIsError,
  } = api.volunteerActivity.participateActivity.useMutation({
    onSuccess: () => refetch(),
  });

  const {
    mutate: leaveActivity,
    isPending: leaveActivityIsPending,
    isError: leaveActivityIsError,
  } = api.volunteerActivity.leaveActivity.useMutation({
    onSuccess: () => refetch(),
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  const isManager =
    session?.user.role.is_volunteer_admin ||
    session?.user.id === activity.organiserId;

  const isEnded = activityIsEnded(activity.endDateTime);

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/volunteer/activity/detail/${activity.id}?v=${activity.version}`,
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

  const ParticipantsCollapse = () => {
    // use form here to prevent from re-rendering on first click
    return (
      <form className="collapse-arrow collapse bg-base-200">
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
          loading={submitActivityForReviewIsPending}
        >
          送出申請
        </ReactiveButton>
      );

    if (activity.status === "INREVIEW") {
      if (!session?.user.role.is_tiani_admin)
        return (
          <ReactiveButton
            className="btn"
            loading={sendReviewNotificationIsPending}
            isSuccess={sendReviewNotificationIsSuccess}
            isError={sendReviewNotificationIsError}
            onClick={() => sendReviewNotification({ activityId: activity.id })}
          >
            <BellAlertIcon className="h-4 w-4" />
            提醒審核
          </ReactiveButton>
        );

      return (
        <ReactiveButton
          className="btn"
          loading={approveActivityIsPending}
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
          content="工作撤銷後就無法復原囉！"
          confirmText="撤銷"
          onConfirm={() => deleteActivity({ activityId: activity.id })}
        />
      </div>
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
            className="btn btn-error"
            onClick={() => setLeaveDialogOpen(true)}
            loading={leaveActivityIsPending}
            isError={leaveActivityIsError}
          >
            <UserMinusIcon className="h-4 w-4" />
            取消報名
          </ReactiveButton>
          <ConfirmDialog
            show={leaveDialogOpen}
            closeModal={() => setLeaveDialogOpen(false)}
            title="取消報名"
            content="確定要取消報名嗎？"
            onConfirm={() => leaveActivity({ activityId: activity.id })}
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
        loading={participateActivityIsPending}
        isError={participateActivityIsError}
      >
        <UserPlusIcon className="h-4 w-4" />
        報名
      </ReactiveButton>
    );
  };

  const CheckInControl = () => {
    const isCheckIn = isNil(checkInData);
    const alreadyCheckOut =
      !isNil(checkInData) && !isNil(checkInData.checkOutAt);

    const isActivityNotYetForCheck = !activityIsStarted(activity.startDateTime);
    const isActivityClosedForCheck = activityIsEnded(activity.endDateTime);

    let checkButtonLabel = "";
    if (isActivityNotYetForCheck)
      checkButtonLabel = " （工作開始前 1 小時開放打卡）";
    if (isActivityClosedForCheck) checkButtonLabel = " （工作已結束）";
    if (alreadyCheckOut)
      checkButtonLabel = ` （已工作 ${formatMilliseconds(
        checkInData.checkOutAt!.getTime() - checkInData.checkOutAt!.getTime(),
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
          <Dialog
            title="定位打卡"
            show={checkInDialogOpen}
            closeModal={() => setCheckInDialogOpen(false)}
          >
            <VolunteerActivityCheckInDialogContent
              activityId={activity.id}
              onCheckInSuccess={() => void refetchCheckInData()}
            />
          </Dialog>
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
      {isManager && <AdminPanel />}

      <ParticipateControl />
      <CheckInControl />

      <ParticipantsCollapse />
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
          <p>開始：{formatDateTime(activity.startDateTime)}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>
            預估時數：
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
