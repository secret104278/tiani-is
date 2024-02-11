import { isNil } from "lodash";
import { useRouter } from "next/router";
import VolunteerActivityForm from "~/components/Form/VolunteerActivityForm";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";

export default function EditVolunteerActivityPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.volunteerActivity.getActivity.useQuery(
    {
      id: Number(id),
    },
  );

  const { activity } = data ?? {};

  if (!isNil(error)) {
    return <AlertWarning>{error.message}</AlertWarning>;
  }

  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <VolunteerActivityForm defaultActivity={activity} />
    </div>
  );
}
