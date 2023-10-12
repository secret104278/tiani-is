import { isNil } from "lodash";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import VolunteerActivityForm from "~/components/VolunteerActivityForm";
import { api } from "~/utils/api";

export default function EditVolunteerActivityPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    data: activity,
    isLoading,
    error,
  } = api.volunteerActivity.getActivity.useQuery({
    id: Number(id),
  });

  if (!isNil(error)) {
    return <AlertWarning>{error.message}</AlertWarning>;
  }

  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到活動</AlertWarning>;

  return (
    <>
      <h1>{activity.title}</h1>
      <VolunteerActivityForm defaultActivity={activity} />
    </>
  );
}
