import { isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function VolunteerActivityCheckRecordPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.volunteerActivity.getActivity.useQuery(
    {
      id: Number(id),
    },
  );
  const { activity } = data ?? {};

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/volunteeractivity/detail/${activity.id}`}>
        {activity?.title}
      </Link>
      <article className="prose">
        <h1>打卡紀錄</h1>
      </article>
    </div>
  );
}
