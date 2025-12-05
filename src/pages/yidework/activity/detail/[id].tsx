import {
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  QueueListIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import _, { isNil } from "lodash";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AddQiudaorenDialogContent from "~/components/DialogContent/AddQiudaorenDialogContent";
import QiudaorenList from "~/components/QiudaorenList";
import { AlertWarning } from "~/components/utils/Alert";
import ConfirmDialog from "~/components/utils/ConfirmDialog";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { useSiteContext } from "~/context/SiteContext";
import { calculateTempleGender } from "~/server/api/routers/yidework/templeGenderUtils";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import type { OGMetaProps } from "~/utils/types";

import {
  activityIsEnded,
  formatDateTime,
  formatDateTitle,
  getActivityStatusText,
  toDuration,
} from "~/utils/ui";

export const getServerSideProps: GetServerSideProps<{
  ogMeta: OGMetaProps;
}> = async (context) => {
  const res = await db.yideWorkActivity.findUnique({
    select: {
      title: true,
      startDateTime: true,
    },
    where: { id: Number(context.query.id) },
  });

  if (isNil(res)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ogMeta: {
        ogTitle: `${res.title}・${formatDateTitle(
          res.startDateTime,
        )}・義德道務網`,
      },
    },
  };
};

export default function YideWorkActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { site } = useSiteContext();

  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.yideworkActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  const [shareBtnLoading, setShareBtnLoading] = useState(false);

  const {
    mutate: deleteActivity,
    isPending: deleteActivityIsPending,
    isError: deleteActivityIsError,
  } = api.yideworkActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/${site}`),
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qiudaorenDialogOpen, setQiudaorenDialogOpen] = useState(false);

  const { data: myQiudaorens } =
    api.yideworkActivity.getQiudaorensByActivityAndCreatedBy.useQuery({
      activityId: Number(id),
    });

  if (!isNil(activityError))
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (activityIsLoading) return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到通知</AlertWarning>;
  if (sessionStatus === "loading") return <div className="loading" />;
  if (isNil(session)) return <AlertWarning>請先登入</AlertWarning>;

  const isManager =
    !!session?.user.role.is_yidework_admin ||
    session?.user.id === activity.organiserId;

  const isEnded = activityIsEnded(activity.endDateTime);

  const isQiudaoYili = activity.title.includes("辦道");

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/yidework/activity/detail/${activity.id}?v=${activity.version}`,
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        <ReactiveButton
          className="btn bg-green-500"
          onClick={() => setShareBtnLoading(true)}
          loading={shareBtnLoading}
        >
          分享至Line
        </ReactiveButton>
      </a>
    );
  };

  const FlowControl = () => {
    if (activity.status === "PUBLISHED") return <ShareLineBtn />;
  };

  const AdminPanel = () => (
    <>
      <div className="divider">通知管理</div>
      <div className="flex flex-row justify-end">
        <div className="badge badge-primary">
          {getActivityStatusText(activity.status)}
        </div>
      </div>
      <div className="flex flex-row space-x-2">
        {!isEnded && <FlowControl />}
        <div className="grow" />
        <Link href={`/yidework/activity/edit/${activity.id}`}>
          <button className="btn">
            <PencilSquareIcon className="h-4 w-4" />
            編輯
          </button>
        </Link>
        <ReactiveButton
          className="btn btn-warning"
          loading={deleteActivityIsPending}
          isError={deleteActivityIsError}
          onClick={() => setDeleteDialogOpen(true)}
        >
          <TrashIcon className="h-4 w-4" />
          撤銷
        </ReactiveButton>
        <ConfirmDialog
          show={deleteDialogOpen}
          closeModal={() => setDeleteDialogOpen(false)}
          title="確認撤銷"
          content="通知撤銷後就無法復原囉！"
          confirmText="撤銷"
          onConfirm={() => deleteActivity({ activityId: activity.id })}
        />
      </div>
      {isQiudaoYili && (
        <Link
          href={`/yidework/activity/qiudaoren/${activity.id}`}
          className="w-full"
        >
          <button className="btn w-full">
            <QueueListIcon className="h-4 w-4" />
            求道人清單
          </button>
        </Link>
      )}
      <div className="divider" />
    </>
  );

  // Fetch and display the details of the book with the given ID
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <div className="flex items-center justify-end space-x-4">
        {!isManager && <ShareLineBtn />}
      </div>

      {isManager && <AdminPanel />}
      <div className="flex flex-col space-y-2 align-bottom">
        <p>壇務：{activity.organiser.name}</p>

        <div className="flex items-center">
          <MapPinIcon className="mr-1 h-4 w-4" />
          <p>佛堂：{activity.location.name}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>開始：{formatDateTime(activity.startDateTime)}</p>
        </div>
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>
            時數：
            {toDuration(activity.startDateTime, activity.endDateTime)}
          </p>
        </div>
        <article className="prose hyphens-auto whitespace-break-spaces break-words py-4">
          {!_.isEmpty(activity.preset) && (
            <>
              {activity.preset.description}
              <div className="divider" />
            </>
          )}
          {activity.description}
        </article>
      </div>

      {isQiudaoYili && (
        <div className="flex flex-row space-x-2">
          <ReactiveButton
            className="btn btn-primary flex-1"
            onClick={() => {
              setQiudaorenDialogOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            新增求道人
          </ReactiveButton>
        </div>
      )}

      {isQiudaoYili && (
        <Dialog
          title="新增新求道人"
          show={qiudaorenDialogOpen}
          closeModal={() => {
            setQiudaorenDialogOpen(false);
          }}
        >
          <AddQiudaorenDialogContent
            activityId={activity.id}
            defaultValues={undefined}
          />
        </Dialog>
      )}

      {myQiudaorens && (
        <QiudaorenList
          qiudaorens={myQiudaorens}
          activityId={activity.id}
          groupBy="qiudaoren"
        />
      )}
    </div>
  );
}
