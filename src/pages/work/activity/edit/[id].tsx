import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import WorkActivityForm from "~/components/Form/WorkActivityForm";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";

export default function EditWorkActivityPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.workActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  if (!isNil(activityError)) {
    return <AlertWarning>{activityError.message}</AlertWarning>;
  }

  if (activityIsLoading || sessionStatus === "loading")
    return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到通知</AlertWarning>;

  const isManager =
    !!session?.user.role.is_work_admin ||
    session?.user.id === activity.organiserId;

  const isStaff = activity.staffs?.some(
    (staff) => staff.user.id === session?.user.id,
  );

  if (!isManager && !isStaff) {
    return <AlertWarning>只有管理員可以進行此操作</AlertWarning>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <WorkActivityForm defaultActivity={activity} />
    </div>
  );
}
