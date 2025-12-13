import {
  CheckCircleIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { CheckCircleIcon as CheckCircleIconOutline } from "@heroicons/react/24/outline";
import type { inferRouterOutputs } from "@trpc/server";
import _ from "lodash";
import { useState } from "react";
import AddQiudaorenDialogContent from "~/components/DialogContent/AddQiudaorenDialogContent";
import Dialog from "~/components/utils/Dialog";
import { cn } from "~/lib/utils";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import {
  TEMPLE_GENDER_LABELS,
  TEMPLE_GENDER_ORDER,
} from "~/server/api/routers/yidework/templeGenderUtils";
import { calculateTempleGender } from "~/server/api/routers/yidework/templeGenderUtils";
import { api } from "~/utils/api";
import ReactiveButton from "./utils/ReactiveButton";

type QiudaorensByActivity =
  inferRouterOutputs<YideWorkRouter>["getQiudaorensByActivity"];

type GroupBy = "qiudaoren" | "yinBaoShi";

const formatPhoneNumber = (phone: string) => {
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
};

export default function QiudaorenList({
  qiudaorens,
  activityId,
  groupBy = "qiudaoren",
}: {
  qiudaorens: QiudaorensByActivity;
  activityId: number;
  groupBy?: GroupBy;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [editingQiudaorenUserId, setEditingQiudaorenUserId] = useState<
    string | undefined
  >(undefined);

  const apiUtils = api.useUtils();
  const { mutate: deleteQiudaoren, isPending: deleteQiudaorenIsPending } =
    api.yideworkActivity.deleteQiudaoren.useMutation({
      onSuccess: () => {
        setDeleteConfirm(null);
        apiUtils.yideworkActivity.getQiudaorensByActivity.invalidate();
        apiUtils.yideworkActivity.getQiudaorensByActivityAndCreatedBy.invalidate();
      },
    });

  const {
    mutate: toggleCheckIn,
    isPending: toggleCheckInIsPending,
    variables: toggleCheckInVariables,
  } = api.yideworkActivity.toggleCheckIn.useMutation({
    onSuccess: () => {
      apiUtils.yideworkActivity.getQiudaorensByActivity.invalidate();
      apiUtils.yideworkActivity.getQiudaorensByActivityAndCreatedBy.invalidate();
    },
  });

  const hasAnyQiudaoren = qiudaorens.length > 0;

  if (!hasAnyQiudaoren) {
    return (
      <div className="py-8 text-center text-gray-500">您尚無新增任何求道人</div>
    );
  }

  const handleDeleteClick = (userId: string, userName: string) => {
    setDeleteConfirm({ userId, userName });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      deleteQiudaoren({
        activityId,
        userId: deleteConfirm.userId,
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const getShiGenderBadgeStyle = (gender: "MALE" | "FEMALE") => {
    return gender === "MALE"
      ? "bg-blue-600 text-white"
      : "bg-pink-600 text-white";
  };

  const QiudaorenCard = ({ item }: { item: QiudaorensByActivity[number] }) => {
    const isCheckedIn = !!item.checkInDate;
    return (
      <div key={item.id} className="card card-bordered bg-base-100">
        <div className="card-body p-3">
          <div className="flex items-start justify-between gap-2 border-gray-100 border-b pb-1">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 text-lg">
                    {item.user.name}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ReactiveButton
                className={cn("btn btn-sm", {
                  "btn-ghost text-gray-400": !isCheckedIn,
                  "btn-success text-white": isCheckedIn,
                })}
                onClick={() =>
                  toggleCheckIn({ activityId, userId: item.user.id })
                }
                loading={
                  toggleCheckInIsPending &&
                  toggleCheckInVariables?.userId === item.user.id
                }
                title={isCheckedIn ? "取消報到" : "報到"}
              >
                {isCheckedIn ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    已到
                  </>
                ) : (
                  <>
                    <CheckCircleIconOutline className="h-4 w-4" />
                    報到
                  </>
                )}
              </ReactiveButton>
              <div className="dropdown dropdown-end">
                <button
                  tabIndex={0}
                  className="btn btn-ghost btn-sm"
                  type="button"
                  aria-label="More options"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
                >
                  <li>
                    <a onClick={() => setEditingQiudaorenUserId(item.user.id)}>
                      <PencilSquareIcon className="h-4 w-4" />
                      編輯
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleDeleteClick(item.user.id, item.user.name ?? "")
                      }
                      className={
                        deleteQiudaorenIsPending &&
                        deleteConfirm?.userId === item.user.id
                          ? "loading"
                          : ""
                      }
                    >
                      <TrashIcon className="h-4 w-4" />
                      刪除
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {(item.user.yinShi || item.user.yinShiPhone) && (
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="pt-0.5 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  引師
                </span>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {item.user.yinShi || "—"}
                    </span>
                    {item.user.yinShiGender && (
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold text-xs ${getShiGenderBadgeStyle(
                          item.user.yinShiGender,
                        )}`}
                      >
                        {item.user.yinShiGender === "MALE" ? "乾" : "坤"}
                      </span>
                    )}
                  </div>
                  {item.user.yinShiPhone && (
                    <a
                      href={`tel:${item.user.yinShiPhone}`}
                      className="inline-flex items-center gap-1.5 font-medium text-gray-600 text-sm"
                    >
                      <PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatPhoneNumber(item.user.yinShiPhone)}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {(item.user.baoShi || item.user.baoShiPhone) && (
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="pt-0.5 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  保師
                </span>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {item.user.baoShi || "—"}
                    </span>
                    {item.user.baoShiGender && (
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold text-xs ${getShiGenderBadgeStyle(
                          item.user.baoShiGender,
                        )}`}
                      >
                        {item.user.baoShiGender === "MALE" ? "乾" : "坤"}
                      </span>
                    )}
                  </div>
                  {item.user.baoShiPhone && (
                    <a
                      href={`tel:${item.user.baoShiPhone}`}
                      className="inline-flex items-center gap-1.5 font-medium text-gray-600 text-sm"
                    >
                      <PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatPhoneNumber(item.user.baoShiPhone)}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {item.createdBy && (
            <div className="mt-2 flex items-center justify-end border-gray-100 border-t pt-2">
              <div className="space-y-1 text-right">
                {item.updatedBy ? (
                  <div className="text-gray-500 text-xs">
                    編輯: {item.updatedBy.name}
                  </div>
                ) : null}
                <div className="text-gray-500 text-xs">
                  新增: {item.createdBy.name}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ConfirmDeleteDialog = () => {
    if (!deleteConfirm) return null;

    const isDeleting = deleteQiudaorenIsPending;

    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg">確認刪除</h3>
          <p className="py-4">
            確定要刪除{" "}
            <span className="font-semibold">{deleteConfirm.userName}</span> 嗎？
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              取消
            </button>
            <button
              className={`btn btn-error text-white ${
                isDeleting ? "loading" : ""
              }`}
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              確認刪除
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCancelDelete}>close</button>
        </form>
      </div>
    );
  };

  const EditDialog = () => {
    if (!editingQiudaorenUserId) return null;

    const groupedByGender = _.groupBy(qiudaorens, (item) =>
      calculateTempleGender(item.user.gender, item.user.birthYear),
    );

    for (const genderKey of ["QIAN", "TONG", "KUN", "NV"] as const) {
      const items = groupedByGender[genderKey];
      if (items) {
        const found = items.find(
          (item: (typeof items)[number]) =>
            item.user.id === editingQiudaorenUserId,
        );
        if (found) {
          return (
            <Dialog
              title="編輯求道人"
              show={!!editingQiudaorenUserId}
              closeModal={() => {
                setEditingQiudaorenUserId(undefined);
              }}
            >
              <AddQiudaorenDialogContent
                activityId={activityId}
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
              />
            </Dialog>
          );
        }
      }
    }

    return null;
  };

  if (groupBy === "qiudaoren") {
    const groupedByGender = _.groupBy(qiudaorens, (item) =>
      calculateTempleGender(item.user.gender, item.user.birthYear),
    );

    return (
      <>
        <div className="space-y-6">
          {TEMPLE_GENDER_ORDER.map((genderKey) => {
            const items = groupedByGender[genderKey];
            if (!items || items.length === 0) return null;
            const sortedItems = _.sortBy(items, (item) => item.user.name);

            return (
              <div key={genderKey}>
                <div className="divider">
                  <span className="font-bold text-lg">
                    {TEMPLE_GENDER_LABELS[genderKey]}
                  </span>
                </div>
                <div className="space-y-2">
                  {sortedItems.map((item) => (
                    <QiudaorenCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <ConfirmDeleteDialog />
        <EditDialog />
      </>
    );
  }

  if (groupBy === "yinBaoShi") {
    const shiFuByGender: Record<
      "MALE" | "FEMALE",
      Map<string, string | undefined>
    > = {
      MALE: new Map(),
      FEMALE: new Map(),
    };

    for (const item of qiudaorens) {
      if (item.user.yinShi && item.user.yinShiGender) {
        shiFuByGender[item.user.yinShiGender].set(
          item.user.yinShi,
          item.user.yinShiPhone ?? undefined,
        );
      }
      if (item.user.baoShi && item.user.baoShiGender) {
        shiFuByGender[item.user.baoShiGender].set(
          item.user.baoShi,
          item.user.baoShiPhone ?? undefined,
        );
      }
    }

    return (
      <>
        <div className="space-y-6">
          {(["MALE", "FEMALE"] as const).map((genderKey) => {
            const entries = _.sortBy(
              Array.from(shiFuByGender[genderKey]?.entries() ?? []),
              (entry) => entry[0],
            );
            if (entries.length === 0) return null;

            const genderLabel = genderKey === "MALE" ? "乾" : "坤";

            return (
              <div key={genderKey}>
                <div className="divider">
                  <span className="font-bold text-lg">{genderLabel}</span>
                </div>
                <div className="space-y-1">
                  {entries.map(([name, phone]) => (
                    <div
                      key={`${name}-${phone}`}
                      className="flex items-center gap-2"
                    >
                      <div className="font-semibold text-lg">{name}</div>
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="inline-flex items-center gap-1.5 font-medium text-gray-600 text-sm"
                        >
                          <PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{formatPhoneNumber(phone)}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <ConfirmDeleteDialog />
        <EditDialog />
      </>
    );
  }
}
