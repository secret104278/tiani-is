"use client";

import {
  BuildingStorefrontIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
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
      <div className="grid grid-cols-2 gap-4">
        {/* Section 1: "我要提供商品" */}
        <Link
          href="/tianishop/my/listings"
          className="block rounded-lg bg-base-100 p-4 shadow transition hover:shadow-md"
        >
          <div className="flex flex-col items-center space-y-3 text-center">
            <BuildingStorefrontIcon className="h-16 w-16 text-primary" />
            <h2 className="font-semibold text-lg">我要提供商品</h2>
            <p className="text-base-content/70 text-xs">
              管理您已上架的商品，或建立新的商品。
            </p>
          </div>
        </Link>

        {/* Section 2: "我要買東西" */}
        <Link
          href="/tianishop/my/orders"
          className="block rounded-lg bg-base-100 p-4 shadow transition hover:shadow-md"
        >
          <div className="flex flex-col items-center space-y-3 text-center">
            <ShoppingBagIcon className="h-16 w-16 text-secondary" />
            <h2 className="font-semibold text-lg">我要買東西</h2>
            <p className="text-base-content/70 text-xs">
              查看您的訂單記錄或繼續購物。
            </p>
          </div>
        </Link>
      </div>

      <div className="divider">所有商品</div>

      {listingsQuery.isLoading && <Loading />}
      {listings && listings.length > 0 && (
        <InfiniteScroll
          dataLength={listings.length}
          next={() => listingsQuery.fetchNextPage()}
          hasMore={listingsQuery.hasNextPage ?? false}
          loader={<Loading />}
          className="grid grid-cols-2 gap-4 [grid-auto-rows:1fr]"
        >
          {listings.map((listing) => (
            <div key={listing.id} className="h-full">
              <ListingCard listing={listing} />
            </div>
          ))}
        </InfiniteScroll>
      )}
      {listings && listings.length === 0 && !listingsQuery.isLoading && (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-sm">目前沒有商品</p>
          </div>
        </div>
      )}
    </div>
  );
}
