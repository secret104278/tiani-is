"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import { api } from "~/trpc/react";

export function CancelOrderItemButton({
  orderItemId,
}: {
  orderItemId: number;
}) {
  const [error, setError] = useState<string>();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const { mutate: cancelOrderItem, isPending } =
    api.tianiShop.cancelOrderItem.useMutation({
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
        title="取消訂單"
        show={showConfirm}
        closeModal={() => setShowConfirm(false)}
      >
        <div className="space-y-4">
          <p>確定要取消此商品嗎？取消後無法復原。</p>
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowConfirm(false)}
            >
              取消
            </button>
            <button
              className="btn btn-error btn-sm"
              onClick={() => {
                cancelOrderItem({ orderItemId });
                setShowConfirm(false);
              }}
              disabled={isPending}
            >
              {isPending ? "處理中..." : "確定取消"}
            </button>
          </div>
        </div>
      </Dialog>
      <button
        className="btn btn-error btn-sm"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        {isPending ? "處理中..." : "取消商品"}
      </button>
    </>
  );
}
