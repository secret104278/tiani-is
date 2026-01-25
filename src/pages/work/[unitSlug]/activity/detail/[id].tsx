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
import { YideWorkType } from "@prisma/client";
import _, { isNil } from "lodash";
import lunisolar from "lunisolar";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AddQiudaorenDialogContent from "~/components/DialogContent/AddQiudaorenDialogContent";
import WorkParticipateDialogContent from "~/components/DialogContent/WorkParticipateDialogContent";
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
import type {
  OGMetaProps,
  VolunteerRole,
  WorkAssignments,
} from "~/utils/types";
import {
  MASTER_WORK_ROLES,
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

const VolunteerListDialog = ({
  show,
  onClose,
  staffs,
}: {
  show: boolean;
  onClose: () => void;
  staffs: {
    user: { id: string; name: string | null };
    volunteerRoles: unknown;
  }[];
}) => {
  const volunteerMap: Record<
    string,
    { upper: string[]; lower: string[]; multiple: string[] }
  > = {};

  for (const staff of staffs) {
    const roles = (staff.volunteerRoles as VolunteerRole[]) || [];
    for (const role of roles) {
      if (!volunteerMap[role.roleKey]) {
        volunteerMap[role.roleKey] = { upper: [], lower: [], multiple: [] };
      }
      const entry = volunteerMap[role.roleKey];
      if (!entry) continue;

      const name = staff.user.name || "未具名";
      if (role.position === "upper") {
        entry.upper.push(name);
      } else if (role.position === "lower") {
        entry.lower.push(name);
      } else {
        entry.multiple.push(name);
      }
    }
  }

  return (
    <Dialog title="志願幫辦名單" show={show} closeModal={onClose}>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto">
        {Object.entries(volunteerMap).map(([roleKey, data]) => {
          const roleDef = MASTER_WORK_ROLES.find((r) => r.key === roleKey);
          if (!roleDef) return null;

          return (
            <div key={roleKey} className="flex flex-col gap-1">
              <p className="font-semibold">{roleDef.label}</p>
              <div className="ml-4 space-y-1 text-sm">
                {roleDef.type === "dual" ? (
                  <>
                    {data.upper.length > 0 && (
                      <p>上首：{data.upper.join(", ")}</p>
                    )}
                    {data.lower.length > 0 && (
                      <p>下首：{data.lower.join(", ")}</p>
                    )}
                  </>
                ) : (
                  <p>{data.multiple.join(", ")}</p>
                )}
              </div>
            </div>
          );
        })}
        {Object.keys(volunteerMap).length === 0 && (
          <p className="py-4 text-center text-gray-500">目前尚無志願幫辦人員</p>
        )}
      </div>
    </Dialog>
  );
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
  const [showVolunteerList, setShowVolunteerList] = useState(false);

  const {
    mutate: deleteActivity,
    isPending: deleteActivityIsPending,
    isError: deleteActivityIsError,
  } = api.workActivity.deleteActivity.useMutation({
    onSuccess: () => router.push(`/${site}${unitSlug ? `/${unitSlug}` : ""}`),
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qiudaorenDialogOpen, setQiudaorenDialogOpen] = useState(false);
  const [participateDialogOpen, setParticipateDialogOpen] = useState(false);

  const { data: myQiudaorens } =
    api.workActivity.getQiudaorensByActivityAndCreatedBy.useQuery({
      activityId: Number(id),
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

  const isOffering = activity.workType === YideWorkType.OFFERING;
  const isCeremony = activity.workType === YideWorkType.CEREMONY;
  const isTaoActivity = activity.workType === YideWorkType.TAO;
  const isQiudaoYili = isTaoActivity; // Keep this for lunar display logic compatibility

  const ShareLineBtn = () => {
    return (
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
          `${window.location.origin}/work/${unitSlug}/activity/detail/${activity.id}?v=${activity.version}`,
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
        <Link href={`/work/${unitSlug}/activity/edit/${activity.id}`}>
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
      {!isOffering && (
        <button
          className="btn btn-outline mt-2 w-full"
          onClick={() => setShowVolunteerList(true)}
        >
          <QueueListIcon className="h-4 w-4" />
          志願幫辦名單
        </button>
      )}

      <VolunteerListDialog
        show={showVolunteerList}
        onClose={() => setShowVolunteerList(false)}
        staffs={activity.staffs}
      />
      {!isOffering && !isCeremony && (
        <WorkActivityStaffManagement activityId={activity.id} />
      )}
    </>
  );

  const QiudaorenPanel = () => (
    <Link
      href={`/work/${unitSlug}/activity/qiudaoren/${activity.id}`}
      className="w-full"
    >
      <button className="btn w-full">
        <QueueListIcon className="h-4 w-4" />
        求道人清單
      </button>
    </Link>
  );

  const ParticipateControl = () => {
    const isOfferingNotice = activity.title === "獻供通知";

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

    const buttonLabel = !isOfferingNotice ? "我可以參與幫辦" : "我可以參加";
    const dialogTitle = !isOfferingNotice ? "我可以參與幫辦" : "我可以參加";

    return (
      <>
        <ReactiveButton
          className="btn btn-accent"
          onClick={() => setParticipateDialogOpen(true)}
        >
          <UserPlusIcon className="h-4 w-4" />
          {buttonLabel}
        </ReactiveButton>
        <Dialog
          title={dialogTitle}
          show={participateDialogOpen}
          closeModal={() => setParticipateDialogOpen(false)}
        >
          <WorkParticipateDialogContent
            activityId={activity.id}
            title={activity.title}
            onSuccess={() => refetch()}
          />
        </Dialog>
      </>
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
      <ParticipateControl />
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
          (activity.rolesConfig ||
            activity.title.includes("辦道") ||
            activity.title.includes("獻供")) &&
          (isTaoActivity ? (
            <div className="collapse-arrow collapse mt-4 bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title divider font-medium">
                工作分配 (點擊展開)
              </div>
              <div className="collapse-content">
                <WorkAssignmentsDisplay
                  assignments={activity.assignments as WorkAssignments}
                  rolesConfig={activity.rolesConfig as string[]}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="divider">工作分配</div>
              <WorkAssignmentsDisplay
                assignments={activity.assignments as WorkAssignments}
                rolesConfig={activity.rolesConfig as string[]}
              />
            </>
          ))}
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
