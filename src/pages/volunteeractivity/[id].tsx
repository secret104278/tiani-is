import { useRouter } from "next/router";
import { api } from "~/utils/api";

export default function VolunteerActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: activity, error } = api.volunteerActivity.getActivity.useQuery({
    id: Number(id),
  });

  if (!activity) {
    return (
      <div className="alert alert-warning">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>找不到</span>
      </div>
    );
  }

  // Fetch and display the details of the book with the given ID
  return (
    <div>
      <h1>{activity.title}</h1>
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
