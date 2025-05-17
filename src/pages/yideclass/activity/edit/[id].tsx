import { isNil } from "lodash";
import { useRouter } from "next/router";
import ClassActivityForm from "~/components/Form/ClassActivityForm";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";

export default function EditClassActivityPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.classActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  if (!isNil(activityError)) {
    return <AlertWarning>{activityError.message}</AlertWarning>;
  }

  if (activityIsLoading) return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <ClassActivityForm defaultActivity={activity} />
    </div>
  );
}
