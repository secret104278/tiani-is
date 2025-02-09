"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import { api } from "~/trpc/react";

export function CompleteOrderItemButton({
  orderItemId,
}: {
  orderItemId: number;
}) {
  const [error, setError] = useState<string>();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const { mutate: completeOrderItem, isPending } =
    api.tianiShop.completeOrderItem.useMutation({
      onSuccess: () => {
        router.refresh();
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  return (
    <>
      {error && <AlertWarning>{error}</AlertWarning>}
      <Dialog
        title="完成訂單"
        show={showConfirm}
        closeModal={() => setShowConfirm(false)}
      >
        <div className="space-y-4">
          <p>確定要將此商品標記為完成嗎？</p>
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowConfirm(false)}
            >
              取消
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                completeOrderItem({ orderItemId });
                setShowConfirm(false);
              }}
              disabled={isPending}
            >
              {isPending ? "處理中..." : "確定完成"}
            </button>
          </div>
        </div>
      </Dialog>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        {isPending ? "處理中..." : "完成訂單"}
      </button>
    </>
  );
}
