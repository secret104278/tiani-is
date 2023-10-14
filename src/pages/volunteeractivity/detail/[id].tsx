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
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function VolunteerActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: session } = useSession();

  const { data, isLoading, error, refetch } =
    api.volunteerActivity.getActivity.useQuery({
      id: Number(id),
    });

  const { activity, isParticipant } = data ?? {};

  const { mutate: submitActivityForReview } =
    api.volunteerActivity.submitActivityForReview.useMutation({
      onSettled: () => refetch(),
    });

  const { mutate: sendReviewNotification } =
    api.volunteerActivity.sendReviewNotification.useMutation({
      onSettled: () => refetch(),
    });

  const { mutate: approveActivity } =
    api.volunteerActivity.approveActivity.useMutation({
      onSettled: () => refetch(),
    });

  const { mutate: sendActivityAdvertisement } =
    api.volunteerActivity.sendActivityAdvertisement.useMutation({
      onSettled: () => refetch(),
    });

  const { mutate: deleteActivity } =
    api.volunteerActivity.deleteActivity.useMutation({
      onSuccess: () => router.push(`/`),
    });

  const { mutate: participateActivity } =
    api.volunteerActivity.participateActivity.useMutation({
      onSuccess: () => refetch(),
    });

  const { mutate: leaveActivity } =
    api.volunteerActivity.leaveActivity.useMutation({
      onSuccess: () => refetch(),
    });

  if (!isNil(error)) {
    return <AlertWarning>{error.message}</AlertWarning>;
  }

  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到活動</AlertWarning>;

  const isManager =
    session?.user.role === "ADMIN" || session?.user.id == activity.organiserId;

  const FlowControl = () => {
    if (activity.status === "DRAFT")
      return (
        <button
          className="btn"
          onClick={() => submitActivityForReview({ activityId: activity.id })}
        >
          送出申請
        </button>
      );

    if (activity.status === "INREVIEW") {
      if (session?.user.role === "USER")
        return (
          <button
            className="btn"
            onClick={() => sendReviewNotification({ activityId: activity.id })}
          >
            <BellAlertIcon className="h-4 w-4" />
            提醒審核
          </button>
        );

      if (session?.user.role === "ADMIN")
        return (
          <button
            className="btn"
            onClick={() => approveActivity({ activityId: activity.id })}
          >
            核准
          </button>
        );
    }

    if (activity.status === "PUBLISHED")
      return (
        <button
          className="btn bg-green-500"
          onClick={() => sendActivityAdvertisement({ activityId: activity.id })}
        >
          推送 Line 通知
        </button>
      );
  };

  const AdminPanel = () => (
    <>
      <div className="divider">活動管理</div>
      <div className="flex flex-row space-x-2">
        <FlowControl />
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
        <button
          className="btn btn-warning"
          onClick={() => deleteActivity({ id: activity.id })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <TrashIcon className="h-4 w-4" />
          </svg>
          撤銷
        </button>
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
                <div className="avatar mr-2">
                  <div className="w-8 rounded-full">
                    <img src={participant.image} />
                  </div>
                </div>
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
    if (activity.participants.length >= activity.headcount)
      return (
        <button className="btn btn-disabled">
          <UserPlusIcon className="h-4 w-4" />
          人數已滿
        </button>
      );

    if (isParticipant)
      return (
        <button
          className="btn btn-secondary"
          onClick={() => leaveActivity({ activityId: activity.id })}
        >
          <UserPlusIcon className="h-4 w-4" />
          取消報名
        </button>
      );

    return (
      <button
        className="btn btn-accent"
        onClick={() => participateActivity({ activityId: activity.id })}
      >
        <UserPlusIcon className="h-4 w-4" />
        報名
      </button>
    );
  };

  // Fetch and display the details of the book with the given ID
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>
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
