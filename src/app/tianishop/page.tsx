/* eslint-disable @next/next/no-img-element */

"use client";

import { PlusIcon } from "@heroicons/react/20/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow, isPast } from "date-fns";
import { zhTW } from "date-fns/locale";
import Link from "next/link";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { thumbHashToDataURL } from "thumbhash";
import { api, type RouterOutputs } from "~/utils/api";
import {
  tianishopListingDetailHref,
  tianishopNewListingHref,
} from "~/utils/navigation";
import { Loading } from "../../components/utils/Loading";

type Listing =
  RouterOutputs["tianiShop"]["getAllListingsInfinite"]["items"][number];

const MIN_DATE = new Date("1970-01-01T00:00:00.000Z");
const MAX_DATE = new Date("9999-12-31T23:59:59.999Z");

function formatPrice(price: number) {
  if (price === 0) return "免費";
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function ListingCard({ listing }: { listing: Listing }) {
  const firstImage = listing.images[0];
  const [imageLoaded, setImageLoaded] = useState(false);

  const isUnlimited =
    listing.startTime.getTime() === MIN_DATE.getTime() &&
    listing.endTime.getTime() === MAX_DATE.getTime();

  const hasStarted = isPast(listing.startTime);
  const hasEnded = isPast(listing.endTime);
  const willStartIn = !hasStarted
    ? formatDistanceToNow(listing.startTime, { locale: zhTW })
    : null;
  const willEndIn =
    hasStarted && !hasEnded
      ? formatDistanceToNow(listing.endTime, { locale: zhTW })
      : null;

  // Don't show ended listings
  if (hasEnded) return null;

  return (
    <Link href={tianishopListingDetailHref(listing.id)}>
      <div className="card bg-base-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <figure className="relative aspect-[4/3] overflow-hidden">
          {firstImage ? (
            <>
              {!imageLoaded && (
                <img
                  src={thumbHashToDataURL(
                    Buffer.from(firstImage.thumbhash, "base64"),
                  )}
                  alt={listing.title}
                  className="absolute h-full w-full object-cover blur-xl"
                />
              )}
              <img
                src={firstImage.key}
                alt={listing.title}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-base-200">
              <PhotoIcon className="h-12 w-12 text-base-content/50" />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <div
              className={`badge badge-lg ${listing.price === 0 ? "badge-accent" : "badge-primary"}`}
            >
              {formatPrice(listing.price)}
            </div>
          </div>
        </figure>
        <div className="card-body p-4">
          <h2 className="card-title line-clamp-2 text-lg">{listing.title}</h2>
          {listing.description && (
            <p className="line-clamp-2 text-sm text-base-content/70">
              {listing.description}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="avatar placeholder">
                  <div className="w-6 rounded-full bg-neutral text-neutral-content">
                    <span className="text-xs">
                      {listing.publisher.name?.[0] ?? "?"}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-base-content/70">
                  {listing.publisher.name}
                </span>
              </div>
              {listing.capacity && (
                <div className="badge badge-ghost badge-sm">
                  限量 {listing.capacity}
                </div>
              )}
            </div>
            {!isUnlimited && (
              <div className="flex flex-col gap-1">
                {willStartIn && (
                  <div className="badge badge-warning badge-sm w-fit gap-1">
                    {willStartIn}後開始
                  </div>
                )}
                {willEndIn && (
                  <div className="badge badge-error badge-sm w-fit gap-1">
                    {willEndIn}後結束
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TianishopPage() {
  const listingsQuery = api.tianiShop.getAllListingsInfinite.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const listings = listingsQuery.data?.pages?.flatMap((page) => page.items);

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>天一友購站</h1>
      </article>

      <div className="flex flex-row justify-end space-x-4">
        <Link href={tianishopNewListingHref()} className="flex-shrink-0">
          <div className="btn btn-primary">
            <PlusIcon className="h-4 w-4" />
            刊登商品
          </div>
        </Link>
      </div>

      <div>
        {listingsQuery.isLoading && <Loading />}
        <InfiniteScroll
          dataLength={listings?.length ?? 0}
          next={() => listingsQuery.fetchNextPage()}
          hasMore={listingsQuery.hasNextPage ?? false}
          loader={<Loading />}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings?.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}
