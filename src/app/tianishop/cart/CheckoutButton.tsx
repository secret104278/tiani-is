"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function CheckoutButton({ cartId }: { cartId: number }) {
  const router = useRouter();

  const { mutate: checkout, isLoading } = api.tianiShop.checkout.useMutation({
    onSuccess: (order) => {
      router.push(`/tianishop/orders/${order.id}`);
    },
  });

  const handleCheckout = () => {
    checkout({ cartId });
  };

  return (
    <button
      className="btn btn-primary w-full"
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        "結帳"
      )}
    </button>
  );
}
