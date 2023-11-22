import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import { isEmpty, isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { AlertWarning } from "~/components/Alert";
import { ModifyCheckRecordDialog } from "~/components/ModifyCheckRecordDialog";
import ReactiveButton from "~/components/ReactiveButton";
import { api } from "~/utils/api";

export default function AdminCasualUserEdit() {
  const router = useRouter();
  const { userId } = router.query;

  const modifyCheckRecordDialogRef = useRef<HTMLDialogElement>(null);
  const [modifyRecord, setModifyRecord] = useState<
    { id: number; checkInAt: Date; checkOutAt: Date | null } | undefined
  >(undefined);

  const manualCheckRecordDialogRef = useRef<HTMLDialogElement>(null);

  const {
    data: user,
    isLoading: userIsLoading,
    error: userError,
  } = api.user.getUser.useQuery({ userId: String(userId) });

  const {
    data: casualCheckHistories,
    isLoading: casualCheckHistoriesIsLoading,
    error: casualCheckHistoriesError,
    refetch: refetchCasualCheckHistories,
  } = api.volunteerActivity.getCasualCheckHistories.useQuery({
    userId: String(userId),
  });

  const {
    mutate: modifyCasualCheckRecord,
    isLoading: modifyCasualCheckRecordIsLoading,
    error: modifyCasualCheckRecordError,
  } = api.volunteerActivity.modifyCasualCheckRecord.useMutation({
    onSuccess: () => {
      void refetchCasualCheckHistories();
      modifyCheckRecordDialogRef.current?.close();
    },
  });

  const {
    mutate: manualCasualCheckRecord,
    isLoading: manualCasualCheckRecordIsLoading,
    error: manualCasualCheckRecordError,
  } = api.volunteerActivity.manualCasualCheckRecord.useMutation({
    onSuccess: () => {
      void refetchCasualCheckHistories();
      manualCheckRecordDialogRef.current?.close();
    },
  });

  if (casualCheckHistoriesIsLoading || userIsLoading)
    return <div className="loading" />;
  if (!isEmpty(casualCheckHistoriesError))
    return <AlertWarning>{casualCheckHistoriesError.message}</AlertWarning>;
  if (!isEmpty(userError))
    return <AlertWarning>{userError.message}</AlertWarning>;
  if (isNil(user)) return <AlertWarning>查無此人</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href="/volunteer/admin/casual">
        ← 日常工作管理
      </Link>
      <article className="prose">
        <h1>{user.name}</h1>
      </article>
      <div className="flex justify-end">
        <ReactiveButton
          className="btn"
          onClick={() => manualCheckRecordDialogRef.current?.showModal()}
        >
          <PlusIcon className="h-4 w-4" />
          手動打卡
        </ReactiveButton>
        <ModifyCheckRecordDialog
          ref={manualCheckRecordDialogRef}
          userName={user.name ?? ""}
          defaultCheckInAt={new Date()}
          onConfirm={(checkInAt, checkOutAt) => {
            manualCasualCheckRecord({
              userId: user.id,
              checkInAt: checkInAt,
              checkOutAt: checkOutAt,
            });
          }}
          isLoading={manualCasualCheckRecordIsLoading}
          error={manualCasualCheckRecordError?.message}
        />
      </div>
      <ModifyCheckRecordDialog
        ref={modifyCheckRecordDialogRef}
        userName={user.name ?? ""}
        defaultCheckInAt={modifyRecord?.checkInAt}
        defaultCheckOutAt={modifyRecord?.checkOutAt ?? undefined}
        onConfirm={(checkInAt, checkOutAt) => {
          modifyRecord &&
            modifyCasualCheckRecord({
              id: modifyRecord.id,
              userId: user.id,
              checkInAt: checkInAt,
              checkOutAt: checkOutAt,
            });
        }}
        isLoading={modifyCasualCheckRecordIsLoading}
        error={modifyCasualCheckRecordError?.message}
      />
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>日期</th>
              <th>簽到</th>
              <th>簽退</th>
              <th>補正</th>
            </tr>
          </thead>
          <tbody>
            {casualCheckHistories?.map((history) => (
              <tr className="hover" key={history.id}>
                <td>{history.checkInAt.toLocaleDateString()}</td>
                <td>{history.checkInAt.toLocaleTimeString()}</td>
                <td>{history.checkOutAt?.toLocaleTimeString()}</td>
                <td>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setModifyRecord(history);
                      modifyCheckRecordDialogRef.current?.showModal();
                    }}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
