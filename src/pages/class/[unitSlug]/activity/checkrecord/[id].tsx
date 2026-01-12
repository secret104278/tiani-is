import { PlusIcon } from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import ManualClassActivityCheckInDialogContent from "~/components/DialogContent/CheckIn/ManualClassActivityCheckInDialogContent";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";
import { formatDate, getUnitByName } from "~/utils/ui";

export default function ClassActivityCheckRecordPage() {
  const { data: sessionData } = useSession();

  const router = useRouter();
  const { id, unitSlug } = router.query;

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.classActivity.getActivity.useQuery({
    activityId: Number(id),
  });

  const {
    data: checkRecords,
    isLoading: checkRecordsIsLoading,
    error: checkRecordsError,
  } = api.classActivity.getActivityCheckRecords.useQuery({
    activityId: Number(id),
  });

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  if (!isNil(activityError))
    return <AlertWarning>{activityError.message}</AlertWarning>;
  if (!isNil(checkRecordsError))
    return <AlertWarning>{checkRecordsError.message}</AlertWarning>;
  if (activityIsLoading || checkRecordsIsLoading)
    return <div className="loading" />;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  const isManager = sessionData?.user.role.is_class_admin;

  return (
    <div className="flex flex-col space-y-4">
      <Link
        className="link"
        href={`/class/${unitSlug}/activity/detail/${activity.id}`}
      >
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>打卡名單</h1>
      </article>
      {isManager && (
        <div className="flex items-center justify-between">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">打卡人數</div>
              <div className="stat-value">{checkRecords?.length}</div>
            </div>
          </div>
          <div>
            <ReactiveButton
              className="btn"
              onClick={() => setCheckInDialogOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              手動打卡
            </ReactiveButton>
            <Dialog
              title="手動打卡"
              show={checkInDialogOpen}
              closeModal={() => setCheckInDialogOpen(false)}
            >
              <ManualClassActivityCheckInDialogContent
                activityId={activity.id}
              />
            </Dialog>
          </div>
        </div>
      )}
      <table className="table-sm table">
        <thead>
          <tr>
            <th>班員</th>
            <th>簽到</th>
          </tr>
        </thead>
        <tbody>
          {checkRecords?.map((record) => (
            <tr key={record.userId}>
              <td>{record.user.name}</td>
              <td>
                {formatDate(record.checkAt)}
                <br />
                {record.checkAt.toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
