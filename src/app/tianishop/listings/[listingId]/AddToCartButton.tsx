"use client";

import { ShoppingCartIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NumberInput } from "~/app/components/number-input";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/trpc/react";

export function AddToCartButton({ listingId }: { listingId: number }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { mutate: addToCart, isPending } = api.tianiShop.addToCart.useMutation({
    onSuccess: () => {
      router.push("/tianishop/cart");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleAddToCart = () => {
    setError(null);
    addToCart({
      listingId,
      quantity,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <AlertWarning>{error}</AlertWarning>}
      <div className="flex flex-row gap-4">
        <NumberInput value={quantity} onChange={setQuantity} />
        <button
          className="btn btn-primary flex-grow"
          onClick={handleAddToCart}
          disabled={isPending}
        >
          <ShoppingCartIcon className="h-4 w-4" />
          {isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "加入購物車"
          )}
        </button>
      </div>
    </div>
  );
}
