import { isNil } from "lodash";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function EtogetherActivityPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.etogetherActivity.getActivity.useQuery(
    {
      id: Number(id),
    },
  );

  const { activity } = data ?? {};

  if (!isNil(error)) {
    return <AlertWarning>{error.message}</AlertWarning>;
  }

  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到活動</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      {/* <EtogetherActivityForm defaultActivity={activity} /> */}
    </div>
  );
}
