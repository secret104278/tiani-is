"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/trpc/react";

export function CheckoutButton({ cartId }: { cartId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { mutate: checkout, isPending } = api.tianiShop.checkout.useMutation({
    onSuccess: (order) => {
      router.push(`/tianishop/orders/${order.id}`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleCheckout = () => {
    setError(null);
    checkout({ cartId });
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <AlertWarning>{error}</AlertWarning>}
      <button
        className="btn btn-primary w-full"
        onClick={handleCheckout}
        disabled={isPending}
      >
        {isPending ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          "結帳"
        )}
      </button>
    </div>
  );
}
