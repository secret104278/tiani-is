import {
  BellAlertIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import ReactiveButton from "~/components/ReactiveButton";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import type { OGMetaProps } from "~/utils/types";
import { getActivityStatusText } from "~/utils/ui";

export const getServerSideProps: GetServerSideProps<{
  ogMeta: OGMetaProps;
}> = async (context) => {
  const res = await db.volunteerActivity.findFirst({
    select: { title: true, startDateTime: true, description: true },
    where: { id: Number(context.query.id) },
  });
  let dateString = "";
  if (!isNil(res)) {
    const d = res.startDateTime;
    dateString = `${d.getMonth()}月${d.getDate()}日 ${d.toLocaleTimeString()} `;
  }

  return {
    props: {
      ogMeta: {
        ogTitle: `${res?.title} - ${dateString} - 天一志工隊`,
        ogDescription: res?.description,
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

  if (!isNil(error)) {
    return <AlertWarning>{error.message}</AlertWarning>;
  }

  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  const isManager =
    session?.user.role === "ADMIN" || session?.user.id == activity.organiserId;

  const isEnded = activity.endDateTime <= new Date();

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

    if (activity.status === "PUBLISHED")
      return (
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
            `${window.location.origin}/volunteeractivity/detail/${activity.id}`,
          )}`}
          target="_blank"
        >
          <button className="btn bg-green-500">分享至Line</button>
        </a>
      );
    // return (
    //   <ReactiveButton
    //     className="btn bg-green-500"
    //     onClick={() => sendActivityAdvertisement({ activityId: activity.id })}
    //     loading={sendActivityAdvertisementIsLoading}
    //     isSuccess={sendActivityAdvertisementIsSuccess}
    //     isError={sendActivityAdvertisementIsError}
    //   >
    //     推送 Line 通知
    //   </ReactiveButton>
    // );
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
        <button
          className="btn"
          onClick={() =>
            void router.push(`/volunteeractivity/edit/${activity.id}`)
          }
        >
          <PencilSquareIcon className="h-4 w-4" />
          編輯
        </button>
        <ReactiveButton
          className="btn btn-warning"
          loading={deleteActivityIsLoading}
          isError={deleteActivityIsError}
          onClick={() =>
            void (
              document.getElementById(
                "confirm_delete_modal",
              ) as HTMLDialogElement
            ).showModal()
          }
        >
          <TrashIcon className="h-4 w-4" />
          撤銷
        </ReactiveButton>
        <dialog id="confirm_delete_modal" className="modal">
          <div className="modal-box">
            <h3 className="text-lg font-bold">確認撤銷</h3>
            <p className="py-4">工作撤銷後就無法復原囉！</p>
            <div className="modal-action">
              <form method="dialog" className="space-x-2">
                <button className="btn">取消</button>
                <button
                  className="btn btn-error"
                  onClick={() => deleteActivity({ id: activity.id })}
                >
                  撤銷
                </button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
      <div className="collapse collapse-arrow  bg-base-200">
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
                      <img src={participant.image} />
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
      </div>
      <div className="divider" />
    </>
  );

  const ParticipateControl = () => {
    if (isParticipant)
      return (
        <ReactiveButton
          className="btn btn-secondary"
          onClick={() => leaveActivity({ activityId: activity.id })}
          loading={leaveActivityIsLoading}
          isError={leaveActivityIsError}
        >
          <UserPlusIcon className="h-4 w-4" />
          取消報名
        </ReactiveButton>
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

  // Fetch and display the details of the book with the given ID
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>
      {isParticipant && (
        <div className="flex justify-end">
          <div className="badge badge-neutral">已報名</div>
        </div>
      )}
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
      </div>
    </div>
  );
}
