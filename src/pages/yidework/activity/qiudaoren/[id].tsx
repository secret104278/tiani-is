import { PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
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
    data: qiudaorenData,
    isLoading: qiudaorenIsLoading,
    error: qiudaorenError,
    refetch: refetchQiudaoren,
  } = api.yideworkActivity.getQiudaorenByActivity.useQuery(
    {
      activityId: Number(id),
    },
    {
      refetchInterval: 1000,
    },
  );

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingQiudaorenUserId, setEditingQiudaorenUserId] = useState<
    string | undefined
  >(undefined);
  const [deletingQiudaorenUserId, setDeletingQiudaorenUserId] = useState<
    string | undefined
  >(undefined);
  const [groupBy, setGroupBy] = useState<"gender" | "shifu">("gender");

  const { mutate: deleteQiudaoren, isPending: deleteQiudaorenIsPending } =
    api.yideworkActivity.deleteQiudaoren.useMutation({
      onSuccess: () => {
        void refetchQiudaoren();
        setDeletingQiudaorenUserId(undefined);
      },
    });

  if (activityError)
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (activityIsLoading) return <div className="loading" />;
  if (!activity) return <AlertWarning>找不到活動</AlertWarning>;
  if (sessionStatus === "loading") return <div className="loading" />;
  if (!session || !session.user.role.is_yidework_admin)
    return <AlertWarning>沒有權限</AlertWarning>;

  const totalQiudaoren = qiudaorenData
    ? Object.values(qiudaorenData).reduce((sum, items) => sum + items.length, 0)
    : 0;

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
          <div className="stat-title">總人數</div>
          <div className="stat-value">{totalQiudaoren}</div>
        </div>
      </div>
      <div className="flex flex-row justify-center">
        <div className="tabs tabs-boxed">
          <button
            className={clsx("tab", {
              "tab-active": groupBy === "gender",
            })}
            onClick={() => setGroupBy("gender")}
            type="button"
          >
            性別
          </button>
          <button
            className={clsx("tab", {
              "tab-active": groupBy === "shifu",
            })}
            onClick={() => setGroupBy("shifu")}
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
        {qiudaorenData && (
          <QiudaorenList
            qiudaoren={qiudaorenData}
            groupBy={groupBy}
            onEdit={(userId) => {
              setEditingQiudaorenUserId(userId);
            }}
            onDelete={(userId) => {
              setDeletingQiudaorenUserId(userId);
              deleteQiudaoren({
                activityId: activity.id,
                userId,
              });
            }}
            isDeleting={
              deleteQiudaorenIsPending ? deletingQiudaorenUserId : undefined
            }
            showGenderLabel={groupBy === "shifu"}
          />
        )}
      </div>
      <Dialog
        title="新增新求道人"
        show={addDialogOpen}
        closeModal={() => setAddDialogOpen(false)}
      >
        <AddQiudaorenDialogContent
          activityId={activity.id}
          onSuccess={() => {
            setAddDialogOpen(false);
            void refetchQiudaoren();
          }}
        />
      </Dialog>
      <Dialog
        title="編輯新求道人"
        show={!!editingQiudaorenUserId}
        closeModal={() => {
          setEditingQiudaorenUserId(undefined);
        }}
      >
        {editingQiudaorenUserId && qiudaorenData
          ? (() => {
              for (const genderKey of ["QIAN", "TONG", "KUN", "NV"] as const) {
                const items = qiudaorenData[genderKey];
                if (items) {
                  const found = items.find(
                    (item: (typeof items)[number]) =>
                      item.user.id === editingQiudaorenUserId,
                  );
                  if (found) {
                    return (
                      <AddQiudaorenDialogContent
                        activityId={activity.id}
                        defaultValues={{
                          userId: found.user.id,
                          name: found.user.name ?? undefined,
                          gender: found.user.gender ?? undefined,
                          birthYear: found.user.birthYear ?? undefined,
                          phone: found.user.phone ?? undefined,
                          yinShi: found.user.yinShi ?? undefined,
                          yinShiGender: found.user.yinShiGender ?? undefined,
                          yinShiPhone: found.user.yinShiPhone ?? undefined,
                          baoShi: found.user.baoShi ?? undefined,
                          baoShiGender: found.user.baoShiGender ?? undefined,
                          baoShiPhone: found.user.baoShiPhone ?? undefined,
                        }}
                        onSuccess={() => {
                          setEditingQiudaorenUserId(undefined);
                          void refetchQiudaoren();
                        }}
                      />
                    );
                  }
                }
              }
              return <AlertWarning>找不到該求道人資料</AlertWarning>;
            })()
          : null}
      </Dialog>
    </div>
  );
}
