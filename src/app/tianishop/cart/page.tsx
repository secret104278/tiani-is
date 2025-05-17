"use client";

import Decimal from "decimal.js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { CartItemCard } from "./CartItemCard";

export default function CartPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [error, setError] = useState<string | null>(null);

  const { data: cart, isLoading } = api.tianiShop.getCart.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum.add(item.listing.price.times(item.quantity)),
      new Decimal(0),
    ) ?? new Decimal(0);

  const { mutate: checkout, isPending: isCheckingOut } =
    api.tianiShop.checkout.useMutation({
      onSuccess: (order) => {
        setError(null);
        router.push(`/tianishop/orders/${order.id}`);
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: updateQuantity, isPending: isUpdating } =
    api.tianiShop.updateCartItemQuantity.useMutation({
      onSuccess: () => {
        setError(null);
        void utils.tianiShop.getCart.invalidate();
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const { mutate: removeFromCart, isPending: isRemoving } =
    api.tianiShop.removeFromCart.useMutation({
      onSuccess: () => {
        setError(null);
        void utils.tianiShop.getCart.invalidate();
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const handleCheckout = () => {
    if (!cart) return;
    checkout({ cartId: cart.id });
  };

  const isMutating = isUpdating || isRemoving || isCheckingOut;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="font-bold text-2xl">購物車是空的</h1>
          <p className="mt-2 text-gray-600 text-sm">快去逛逛吧！</p>
          <a href="/tianishop" className="btn btn-primary btn-sm mt-4">
            回到商店
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-6", {
        "pointer-events-none opacity-50": isLoading,
      })}
    >
      <h1 className="font-bold text-2xl">購物車</h1>

      {error && <AlertWarning>{error}</AlertWarning>}

      <div className="relative">
        <div className="space-y-4">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) =>
                  updateQuantity({ cartItemId: item.id, quantity })
                }
                onRemove={() => removeFromCart({ cartItemId: item.id })}
                isUpdating={isUpdating}
                isRemoving={isRemoving}
              />
            ))}
          </div>

          <div className="rounded-lg bg-base-200 p-4">
            <h2 className="font-semibold text-lg">訂單摘要</h2>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>小計</span>
                <span>NT$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>運費</span>
                <span>免費</span>
              </div>
              <div className="border-base-300 border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>總計</span>
                  <span>NT$ {subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                className="btn btn-primary w-full"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    結帳中...
                  </>
                ) : (
                  "結帳"
                )}
              </button>
            </div>
          </div>
        </div>

        {isMutating && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100/30">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
