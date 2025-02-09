/* eslint-disable @next/next/no-img-element */

import { api } from "~/trpc/server";
import { ListingCard } from "./ListingCard";

export default async function TianiShopPage() {
  const { items } = await api.tianiShop.getAllListingsInfinite({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 [grid-auto-rows:1fr]">
        {items.map((listing) => (
          <div key={listing.id} className="h-full">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  );
}
