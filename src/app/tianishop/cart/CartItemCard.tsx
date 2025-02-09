"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { thumbHashToDataURL } from "thumbhash";
import { NumberInput } from "~/app/components/number-input";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/shared";

type CartItem = NonNullable<
  RouterOutputs["tianiShop"]["getCart"]
>["items"][number];

export function CartItemCard({ item }: { item: CartItem }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(item.quantity);

  const { mutate: updateQuantity } =
    api.tianiShop.updateCartItemQuantity.useMutation({
      onSuccess: () => {
        router.refresh();
      },
    });

  const { mutate: removeFromCart } = api.tianiShop.removeFromCart.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    updateQuantity({
      cartItemId: item.id,
      quantity: newQuantity,
    });
  };

  const handleRemove = () => {
    removeFromCart({
      cartItemId: item.id,
    });
  };

  return (
    <div className="flex gap-4 rounded-lg bg-base-100 p-4 shadow-sm">
      <div className="relative aspect-square w-24 overflow-hidden rounded-lg">
        {item.listing.images[0] && (
          <Image
            src={item.listing.images[0].key}
            alt={item.listing.title}
            fill
            className="object-cover"
            placeholder="blur"
            blurDataURL={thumbHashToDataURL(
              Buffer.from(item.listing.images[0].thumbhash, "base64"),
            )}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{item.listing.title}</h3>
            <p className="text-sm text-gray-600">
              單價：NT$ {item.listing.price.toLocaleString()}
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm text-error"
            onClick={handleRemove}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <NumberInput value={quantity} onChange={handleQuantityChange} />

          <div className="text-right">
            <div className="font-semibold">
              NT$ {(item.quantity * item.listing.price).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
