"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/trpc/react";

export function CancelOrderItemButton({
  orderItemId,
}: {
  orderItemId: number;
}) {
  const [error, setError] = useState<string>();
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
      <button
        className="btn btn-error btn-sm"
        onClick={() => {
          if (window.confirm("確定要取消此商品嗎？取消後無法復原。")) {
            cancelOrderItem({ orderItemId });
          }
        }}
        disabled={isPending}
      >
        {isPending ? "處理中..." : "取消商品"}
      </button>
    </>
  );
}
