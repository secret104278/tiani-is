import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function VolunteerActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: session } = useSession();

  const {
    data: activity,
    isLoading,
    error,
    refetch,
  } = api.volunteerActivity.getActivity.useQuery({
    id: Number(id),
  });

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

  if (!isNil(error)) {
    return <AlertWarning>{error.message}</AlertWarning>;
  }

  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到活動</AlertWarning>;

  // Fetch and display the details of the book with the given ID
  return (
    <div>
      <h1>{activity.title}</h1>
      {activity.status === "DRAFT" && (
        <button
          className="btn"
          onClick={() => submitActivityForReview({ activityId: activity.id })}
        >
          送出申請
        </button>
      )}
      {activity.status === "INREVIEW" && session?.user.role === "USER" && (
        <button
          className="btn"
          onClick={() => sendReviewNotification({ activityId: activity.id })}
        >
          提醒審核
        </button>
      )}
      {activity.status === "INREVIEW" && session?.user.role === "ADMIN" && (
        <button
          className="btn"
          onClick={() => approveActivity({ activityId: activity.id })}
        >
          核准
        </button>
      )}
      {(session?.user.role === "ADMIN" ||
        session?.user.id === activity.organiserId) && (
        <>
          <button
            className="btn"
            onClick={() =>
              void router.push(`/volunteeractivity/edit/${activity.id}`)
            }
          >
            編輯
          </button>
          <button
            className="btn"
            onClick={() => deleteActivity({ id: activity.id })}
          >
            撤銷
          </button>
        </>
      )}
      {activity.status === "PUBLISHED" &&
        (session?.user.role === "ADMIN" ||
          session?.user.id == activity.organiserId) && (
          <button
            className="btn bg-green-500"
            onClick={() =>
              sendActivityAdvertisement({ activityId: activity.id })
            }
          >
            推送 Line 通知
          </button>
        )}

      <ul className="list-disc">
        <li>需求人數：{activity.headcount}</li>
        <li>地點：{activity.location}</li>
        <li>
          時間：{activity.startDateTime.toLocaleString()} 至{" "}
          {activity.endDateTime.toLocaleString()}
        </li>
      </ul>
    </div>
  );
}
