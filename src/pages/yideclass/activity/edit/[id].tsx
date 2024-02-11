import { isNil } from "lodash";
import { useRouter } from "next/router";
import ClassActivityForm from "~/components/Form/ClassActivityForm";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";

export default function EditClassActivityPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.classActivity.getActivity.useQuery({
    id: Number(id),
  });

  const { activity } = data ?? {};

  if (!isNil(error)) {
    return <AlertWarning>{error.message}</AlertWarning>;
  }

  if (isLoading) return <div className="loading"></div>;
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
