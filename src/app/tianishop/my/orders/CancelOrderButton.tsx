"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/trpc/react";

export function CancelOrderButton({ orderId }: { orderId: number }) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { mutate: cancelOrder, isPending } =
    api.tianiShop.cancelOrder.useMutation({
      onSuccess: () => {
        setError(null);
        router.refresh();
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  return (
    <div>
      {error && <AlertWarning>{error}</AlertWarning>}
      <button
        className="btn btn-error btn-sm"
        onClick={() => cancelOrder({ orderId })}
        disabled={isPending}
      >
        {isPending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          "取消訂單"
        )}
      </button>
    </div>
  );
}
