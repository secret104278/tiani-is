import {
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import type { inferRouterOutputs } from "@trpc/server";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import {
  TEMPLE_GENDER_LABELS,
  TEMPLE_GENDER_ORDER,
  calculateTempleGender,
} from "~/server/api/routers/yidework/templeGenderUtils";
import ReactiveButton from "./utils/ReactiveButton";

type QiudaorenByActivity =
  inferRouterOutputs<YideWorkRouter>["getQiudaorenByActivity"];

type GroupBy = "gender" | "shifu";

export default function QiudaorenList({
  qiudaoren,
  onEdit,
  onDelete,
  isDeleting,
  showGenderLabel = false,
  groupBy = "gender",
}: {
  qiudaoren: QiudaorenByActivity;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  isDeleting?: string;
  showGenderLabel?: boolean;
  groupBy?: GroupBy;
}) {
  const hasAnyQiudaoren = TEMPLE_GENDER_ORDER.some(
    (key) => qiudaoren[key]?.length > 0,
  );

  if (!hasAnyQiudaoren) {
    return <div className="py-8 text-center text-gray-500">尚無新求道人</div>;
  }

  const getShifuGroupedData = () => {
    const grouped: Record<
      string,
      (typeof qiudaoren.QIAN extends (infer T)[] ? T : never)[]
    > = {};

    for (const genderKey of TEMPLE_GENDER_ORDER) {
      const items = qiudaoren[genderKey];
      if (items) {
        for (const item of items) {
          const shiFuName = item.user.yinShi || item.user.baoShi || "未分配";
          if (!grouped[shiFuName]) grouped[shiFuName] = [];
          grouped[shiFuName]!.push(item);
        }
      }
    }

    return grouped;
  };

  const getGenderKeyForItem = (recordId: number) => {
    for (const genderKey of TEMPLE_GENDER_ORDER) {
      const items = qiudaoren[genderKey as keyof typeof qiudaoren];
      if (items?.find((i) => i.id === recordId)) {
        return genderKey;
      }
    }
    return undefined;
  };

  const getGenderBadgeStyle = (
    genderKey: (typeof TEMPLE_GENDER_ORDER)[number],
  ) => {
    const colorMap: Record<(typeof TEMPLE_GENDER_ORDER)[number], string> = {
      QIAN: "bg-blue-600 text-white",
      TONG: "bg-blue-400 text-white",
      KUN: "bg-pink-600 text-white",
      NV: "bg-pink-400 text-white",
    };
    return colorMap[genderKey] || "bg-gray-500 text-white";
  };

  const getShiGenderBadgeStyle = (gender: "MALE" | "FEMALE") => {
    return gender === "MALE"
      ? "bg-blue-600 text-white"
      : "bg-pink-600 text-white";
  };

  const renderQiudaorenCard = (
    item: (typeof qiudaoren.QIAN)[number],
    genderKey?: (typeof TEMPLE_GENDER_ORDER)[number],
  ) => {
    const displayGenderKey = genderKey || getGenderKeyForItem(item.id);

    return (
      <div key={item.id} className="card card-bordered bg-base-100">
        <div className="card-body p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-extrabold text-lg">{item.user.name}</h3>
                {displayGenderKey && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs ${getGenderBadgeStyle(
                      displayGenderKey,
                    )}`}
                  >
                    {TEMPLE_GENDER_LABELS[displayGenderKey]}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {(item.user.yinShi || item.user.yinShiPhone) && (
                  <div className="flex items-start gap-2">
                    <span className="whitespace-nowrap font-medium text-gray-700">
                      引師：
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">
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
                          className="mt-0.5 flex items-center gap-1 text-gray-600"
                        >
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <span>{item.user.yinShiPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {(item.user.baoShi || item.user.baoShiPhone) && (
                  <div className="flex items-start gap-2">
                    <span className="whitespace-nowrap font-medium text-gray-700">
                      保師：
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">
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
                          className="mt-0.5 flex items-center gap-1 text-gray-600"
                        >
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <span>{item.user.baoShiPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-2">
              <button
                className="btn-ghost btn btn-sm"
                onClick={() => onEdit(item.user.id)}
                type="button"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
              <ReactiveButton
                className="btn-error btn-ghost btn btn-sm"
                onClick={() => onDelete(item.user.id)}
                loading={isDeleting === item.user.id}
              >
                <TrashIcon className="h-4 w-4" />
              </ReactiveButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (groupBy === "gender") {
    return (
      <div className="space-y-6">
        {TEMPLE_GENDER_ORDER.map((genderKey) => {
          const items = qiudaoren[genderKey];
          if (!items || items.length === 0) return null;

          return (
            <div key={genderKey}>
              <div className="divider">
                <span className="font-bold text-lg">
                  {TEMPLE_GENDER_LABELS[genderKey]}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((item) => renderQiudaorenCard(item, genderKey))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const shiFuGrouped = getShifuGroupedData();
  return (
    <div className="space-y-6">
      {Object.entries(shiFuGrouped).map(([shiFuName, items]) => (
        <div key={shiFuName}>
          <div className="divider">
            <span className="font-bold text-lg">{shiFuName}</span>
          </div>
          <div className="space-y-2">
            {items.map((item) => renderQiudaorenCard(item))}
          </div>
        </div>
      ))}
    </div>
  );
}
