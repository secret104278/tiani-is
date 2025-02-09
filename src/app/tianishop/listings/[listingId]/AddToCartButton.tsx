"use client";

import { ShoppingCartIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NumberInput } from "~/app/components/number-input";
import { api } from "~/trpc/react";

export function AddToCartButton({ listingId }: { listingId: number }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const { mutate: addToCart } = api.tianiShop.addToCart.useMutation({
    onSuccess: () => {
      router.push("/tianishop/cart");
    },
  });

  const handleAddToCart = () => {
    addToCart({
      listingId,
      quantity,
    });
  };

  return (
    <div className="flex flex-row gap-4">
      <NumberInput value={quantity} onChange={setQuantity} />
      <button className="btn btn-primary flex-grow" onClick={handleAddToCart}>
        <ShoppingCartIcon className="h-4 w-4" />
        加入購物車
      </button>
    </div>
  );
}
