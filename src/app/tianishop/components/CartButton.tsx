"use client";

import { ShoppingCartIcon } from "@heroicons/react/20/solid";
import { api } from "~/trpc/react";

export function CartButton() {
  const { data: itemCount = 0 } = api.tianiShop.getCartItemCount.useQuery();

  return (
    <a href="/tianishop/cart" className="btn btn-circle btn-ghost">
      <div className="indicator">
        <ShoppingCartIcon className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="badge indicator-item badge-primary badge-sm">
            {itemCount}
          </span>
        )}
      </div>
    </a>
  );
}
