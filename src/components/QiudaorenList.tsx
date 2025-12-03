import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import type { inferRouterOutputs } from "@trpc/server";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import {
  TEMPLE_GENDER_LABELS,
  TEMPLE_GENDER_ORDER,
} from "~/server/api/routers/yidework/templeGenderUtils";
import ReactiveButton from "./utils/ReactiveButton";

type QiudaorenByActivity =
  inferRouterOutputs<YideWorkRouter>["getQiudaorenByActivity"];

export default function QiudaorenList({
  qiudaoren,
  onEdit,
  onDelete,
  isDeleting,
}: {
  qiudaoren: QiudaorenByActivity;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  isDeleting?: string;
}) {
  const hasAnyQiudaoren = TEMPLE_GENDER_ORDER.some(
    (key) => qiudaoren[key]?.length > 0,
  );

  if (!hasAnyQiudaoren) {
    return <div className="py-8 text-center text-gray-500">尚無新求道人</div>;
  }

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
              {items.map((item) => (
                <div
                  key={item.id}
                  className="card card-bordered card-compact bg-base-100"
                >
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{item.user.name}</p>
                        {(item.user.yinShi ||
                          item.user.yinShiPhone ||
                          item.user.baoShi ||
                          item.user.baoShiPhone) && (
                          <div className="mt-1 space-y-1 text-gray-500 text-sm">
                            {(item.user.yinShi || item.user.yinShiPhone) && (
                              <div>
                                {item.user.yinShi && (
                                  <span>引師：{item.user.yinShi}</span>
                                )}
                                {item.user.yinShiPhone && (
                                  <span className="ml-2">
                                    📞 {item.user.yinShiPhone}
                                  </span>
                                )}
                              </div>
                            )}
                            {(item.user.baoShi || item.user.baoShiPhone) && (
                              <div>
                                {item.user.baoShi && (
                                  <span>保師：{item.user.baoShi}</span>
                                )}
                                {item.user.baoShiPhone && (
                                  <span className="ml-2">
                                    📞 {item.user.baoShiPhone}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="btn btn-sm"
                          onClick={() => onEdit(item.user.id)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <ReactiveButton
                          className="btn btn-sm btn-error"
                          onClick={() => onDelete(item.user.id)}
                          loading={isDeleting === item.user.id}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </ReactiveButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
