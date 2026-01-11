import {
  ClockIcon,
  FlagIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  QueueListIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";
import _, { isNil } from "lodash";
import lunisolar from "lunisolar";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AddQiudaorenDialogContent from "~/components/DialogContent/AddQiudaorenDialogContent";
import {
  getHourLabel,
  getTimeToHourValue,
} from "~/components/QiudaoLunarDisplay";
import QiudaorenList from "~/components/QiudaorenList";
import WorkActivityStaffManagement from "~/components/WorkActivityStaffManagement";
import WorkAssignmentsDisplay from "~/components/WorkAssignmentsDisplay";
import { AlertWarning } from "~/components/utils/Alert";
import ConfirmDialog from "~/components/utils/ConfirmDialog";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { useSiteContext } from "~/context/SiteContext";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import type { OGMetaProps, WorkAssignments } from "~/utils/types";

import {
  activityIsEnded,
  formatDateTime,
  formatDateTitle,
  getActivityStatusText,
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
        ogTitle: `${res.title}・${formatDateTitle(res.startDateTime)}・道務網`,
      },
    },
  };
};

export default function WorkActivityDetailPage() {
  const router = useRouter();
  const { id, unitSlug } = router.query;

  const { site } = useSiteContext();

  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
    refetch,
  } = api.workActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  const [shareBtnLoading, setShareBtnLoading] = useState(false);

  const {
    mutate: deleteActivity,
    isPending: deleteActivityIsPending,
    isError: deleteActivityIsError,
  } = api.workActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/${site}${unitSlug ? `/${unitSlug}` : ""}`),
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qiudaorenDialogOpen, setQiudaorenDialogOpen] = useState(false);

  const { data: myQiudaorens } =
    api.workActivity.getQiudaorensByActivityAndCreatedBy.useQuery({
      activityId: Number(id),
    });

  const {
    mutate: participateActivity,
    isPending: participateActivityIsPending,
  } = api.workActivity.participateActivity.useMutation({
    onSuccess: () => refetch(),
  });

  const { mutate: leaveActivity, isPending: leaveActivityIsPending } =
    api.workActivity.leaveActivity.useMutation({
      onSuccess: () => refetch(),
    });

  if (!isNil(activityError))
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (activityIsLoading || sessionStatus === "loading")
    return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到通知</AlertWarning>;
  if (isNil(session)) return <AlertWarning>請先登入</AlertWarning>;

  const isManager =
    !!session.user.role.is_work_admin ||
    session.user.id === activity.organiser.id;

  const isStaff = activity.staffs?.some(
    (staff) => staff.user.id === session.user.id,
  );

  const isEnded = activityIsEnded(activity.endDateTime);

  const isQiudaoYili = activity.title.includes("辦道");
  const isOffering = activity.title === "獻供通知";

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/work/activity/detail/${activity.id}?v=${activity.version}${unitSlug ? `&unitSlug=${unitSlug}` : ""}`,
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
        <Link
          href={`/work/activity/edit/${activity.id}${unitSlug ? `?unitSlug=${unitSlug}` : ""}`}
        >
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
      {!isOffering && <WorkActivityStaffManagement activityId={activity.id} />}
    </>
  );

  const QiudaorenPanel = () => (
    <Link
      href={`/work/activity/qiudaoren/${activity.id}${unitSlug ? `?unitSlug=${unitSlug}` : ""}`}
      className="w-full"
    >
      <button className="btn w-full">
        <QueueListIcon className="h-4 w-4" />
        求道人清單
      </button>
    </Link>
  );

  const ParticipateControl = () => {
    if (!isOffering) return null;
    if (isEnded) return null;

    if (isStaff) {
      return (
        <ReactiveButton
          className="btn btn-error"
          onClick={() => leaveActivity({ activityId: activity.id })}
          loading={leaveActivityIsPending}
        >
          <UserMinusIcon className="h-4 w-4" />
          取消參加
        </ReactiveButton>
      );
    }

    return (
      <ReactiveButton
        className="btn btn-accent"
        onClick={() => participateActivity({ activityId: activity.id })}
        loading={participateActivityIsPending}
      >
        <UserPlusIcon className="h-4 w-4" />
        我要參加
      </ReactiveButton>
    );
  };

  const StaffList = () => {
    if (!isOffering) return null;
    if (!isManager) return null;

    return (
      <form className="collapse-arrow collapse bg-base-200">
        <input type="checkbox" />
        <div className="collapse-title font-medium">
          參與人員清單 ({activity.staffs?.length || 0})
        </div>
        <div className="collapse-content">
          <ul className="space-y-2">
            {activity.staffs?.map((staff) => (
              <li key={staff.user.id} className="flex items-center">
                {staff.user.name}
              </li>
            ))}
          </ul>
        </div>
      </form>
    );
  };

  const TimeDisplay = () => {
    const solarDate = activity.startDateTime;
    const lunar = lunisolar(solarDate);
    const lunarDateStr = lunar.format("cY年 lMlD");
    const hourValue = getTimeToHourValue(solarDate);
    const hourLabel = getHourLabel(hourValue);

    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center">
          <ClockIcon className="mr-1 h-4 w-4" />
          <p>國曆：{formatDateTime(solarDate)}</p>
        </div>
        {isQiudaoYili && (
          <div className="flex items-center">
            <ClockIcon className="mr-1 h-4 w-4" />
            <p>
              農曆：{lunarDateStr} {hourLabel}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>
      <div className="flex items-center justify-end space-x-4">
        {!isManager && <ShareLineBtn />}
      </div>
      {isManager && <AdminPanel />}
      {isOffering && <StaffList />}
      {isQiudaoYili && (isManager || isStaff) && (
        <div className="flex flex-row space-x-2">
          <QiudaorenPanel />
        </div>
      )}
      {isOffering && <ParticipateControl />}
      <div className="flex flex-col space-y-2 align-bottom">
        <p>壇務：{activity.organiser.name}</p>

        {activity.festival && (
          <div className="flex items-center">
            <FlagIcon className="mr-1 h-4 w-4" />
            <p>節日：{activity.festival}</p>
          </div>
        )}
        <div className="flex items-center">
          <MapPinIcon className="mr-1 h-4 w-4" />
          <p>佛堂：{activity.location.name}</p>
        </div>
        <TimeDisplay />
        {!_.isEmpty(activity.description?.trim()) && (
          <article className="prose hyphens-auto whitespace-break-spaces break-words py-4">
            {activity.description}
          </article>
        )}

        {!_.isEmpty(activity.assignments) &&
          (activity.title.includes("辦道") ||
            activity.title.includes("獻供")) && (
            <>
              <div className="divider">工作分配</div>
              <WorkAssignmentsDisplay
                assignments={activity.assignments as WorkAssignments}
              />
            </>
          )}
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
            我要帶人來求道
          </ReactiveButton>
        </div>
      )}

      {isQiudaoYili && (
        <Dialog
          title="我要帶人來求道"
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

      {isQiudaoYili && myQiudaorens && (
        <QiudaorenList
          qiudaorens={myQiudaorens}
          activityId={activity.id}
          groupBy="qiudaoren"
        />
      )}
    </div>
  );
}
