import { PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import _ from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AddQiudaorenDialogContent from "~/components/DialogContent/AddQiudaorenDialogContent";
import QiudaorenList from "~/components/QiudaorenList";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";

export default function YideWorkActivityQiudaorenPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const { id } = router.query;

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.yideworkActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  const {
    data: qiudaorens,
    isLoading: qiudaorenIsLoading,
    error: qiudaorenError,
  } = api.yideworkActivity.getQiudaorensByActivity.useQuery(
    {
      activityId: Number(id),
    },
    {
      refetchInterval: 1000,
    },
  );

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<"qiudaoren" | "yinBaoShi">(
    "qiudaoren",
  );

  if (activityError)
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (activityIsLoading) return <div className="loading" />;
  if (!activity) return <AlertWarning>找不到活動</AlertWarning>;
  if (sessionStatus === "loading") return <div className="loading" />;
  if (!session) return <AlertWarning>請先登入</AlertWarning>;

  const isManager =
    !!session.user.role.is_yidework_admin ||
    session.user.id === activity.organiserId;

  const isStaff =
    !isManager &&
    activity.staffs?.some((staff) => staff.user.id === session?.user.id);

  if (!isManager && !isStaff) return <AlertWarning>沒有權限</AlertWarning>;

  const totalQiudaoren = qiudaorens?.length ?? 0;

  const totalYinBaoShi = _.uniq(
    _.concat(
      qiudaorens?.flatMap((item) => item.user.yinShi) ?? [],
      qiudaorens?.flatMap((item) => item.user.baoShi) ?? [],
    ),
  ).length;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/yidework/activity/detail/${activity.id}`}>
        ← {activity.title}
      </Link>
      <article className="prose">
        <h1>求道人清單</h1>
      </article>
      <ReactiveButton className="btn" onClick={() => setAddDialogOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        新增求道人
      </ReactiveButton>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">求道人數</div>
          <div className="stat-value">{totalQiudaoren}</div>
        </div>
        <div className="stat">
          <div className="stat-title">引保師人數</div>
          <div className="stat-value">{totalYinBaoShi}</div>
        </div>
      </div>
      <div className="flex flex-row justify-center">
        <div className="tabs tabs-boxed">
          <button
            className={clsx("tab", {
              "tab-active": groupBy === "qiudaoren",
            })}
            onClick={() => {
              setGroupBy("qiudaoren");
            }}
            type="button"
          >
            求道人
          </button>
          <button
            className={clsx("tab", {
              "tab-active": groupBy === "yinBaoShi",
            })}
            onClick={() => {
              setGroupBy("yinBaoShi");
            }}
            type="button"
          >
            引保師
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {qiudaorenIsLoading && <div className="loading" />}
        {qiudaorenError && (
          <AlertWarning>{qiudaorenError.message}</AlertWarning>
        )}
        {qiudaorens && (
          <QiudaorenList
            qiudaorens={qiudaorens}
            activityId={activity.id}
            groupBy={groupBy}
          />
        )}
      </div>
      <Dialog
        title="新增求道人"
        show={addDialogOpen}
        closeModal={() => setAddDialogOpen(false)}
      >
        <AddQiudaorenDialogContent activityId={activity.id} />
      </Dialog>
    </div>
  );
}
