"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { thumbHashToDataURL } from "thumbhash";
import { NumberInput } from "~/app/components/number-input";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/shared";

type CartItem = NonNullable<
  RouterOutputs["tianiShop"]["getCart"]
>["items"][number];

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
  isRemoving,
}: CartItemCardProps) {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (isUpdating || isRemoving) return;
    setQuantity(newQuantity);
    onUpdateQuantity(newQuantity);
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
            onClick={onRemove}
            disabled={isUpdating || isRemoving}
          >
            {isRemoving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <TrashIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div
            className={cn("relative", {
              "pointer-events-none opacity-50": isUpdating || isRemoving,
            })}
          >
            <NumberInput value={quantity} onChange={handleQuantityChange} />
            {isUpdating && (
              <div className="absolute inset-0 flex items-center justify-center bg-base-100/50">
                <span className="loading loading-spinner loading-xs" />
              </div>
            )}
          </div>

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
