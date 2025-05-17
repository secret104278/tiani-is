"use client";

import InfiniteScroll from "react-infinite-scroll-component";
import { Loading } from "~/components/utils/Loading";
import { api } from "~/trpc/react";
import { ListingCard } from "./ListingCard";

export default function TianiShopPage() {
  const listingsQuery = api.tianiShop.getAllListingsInfinite.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const listings = listingsQuery.data?.pages.flatMap((page) => page.items);

  return (
    <div className="space-y-6">
      <InfiniteScroll
        dataLength={listings?.length ?? 0}
        next={() => listingsQuery.fetchNextPage()}
        hasMore={listingsQuery.hasNextPage ?? false}
        loader={<Loading />}
        className="grid grid-cols-2 gap-4 [grid-auto-rows:1fr]"
      >
        {listings?.map((listing) => (
          <div key={listing.id} className="h-full">
            <ListingCard listing={listing} />
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}
