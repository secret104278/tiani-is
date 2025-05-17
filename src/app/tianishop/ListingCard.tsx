"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow, isPast } from "date-fns";
import { zhTW } from "date-fns/locale";
import type Decimal from "decimal.js";
import Image from "next/image";
import Link from "next/link";
import { thumbHashToDataURL } from "thumbhash";
import type { RouterOutputs } from "~/trpc/shared";

type Listing =
  RouterOutputs["tianiShop"]["getAllListingsInfinite"]["items"][number];

function formatPrice(price: Decimal) {
  if (price.isZero()) return "免費";
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price.toNumber());
}

export function ListingCard({ listing }: { listing: Listing }) {
  const firstImage = listing.images[0];

  const hasStarted = listing.startTime ? isPast(listing.startTime) : true;
  const hasEnded = listing.endTime ? isPast(listing.endTime) : false;
  const willStartIn =
    !hasStarted && listing.startTime
      ? formatDistanceToNow(listing.startTime, { locale: zhTW })
      : null;
  const willEndIn =
    !hasEnded && listing.endTime
      ? formatDistanceToNow(listing.endTime, { locale: zhTW })
      : null;

  // Don't show ended listings
  if (hasEnded) return null;

  return (
    <Link href={`/tianishop/listings/${listing.id}`} className="block h-full">
      <div className="group relative h-full overflow-hidden rounded-lg bg-base-100 shadow">
        {/* Image Section */}
        <div className="relative aspect-[4/3]">
          {firstImage ? (
            <Image
              src={firstImage.key}
              alt={listing.title}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL={thumbHashToDataURL(
                Buffer.from(firstImage.thumbhash, "base64"),
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-base-200">
              <PhotoIcon className="h-12 w-12 text-base-content/50" />
            </div>
          )}

          {/* Time badges */}
          {(willStartIn ?? willEndIn) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {willStartIn && (
                <div className="badge badge-warning badge-sm gap-1 shadow-lg">
                  {willStartIn}後開始
                </div>
              )}
              {willEndIn && (
                <div className="badge badge-error badge-sm gap-1 shadow-lg">
                  {willEndIn}後結束
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-2 p-3">
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-2 font-bold text-base leading-tight">
              {listing.title}
            </h2>
            <div
              className={`shrink-0 rounded-full px-2 py-0.5 font-semibold text-sm ${
                listing.price.isZero()
                  ? "bg-accent/10 text-accent"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {formatPrice(listing.price)}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <p className="line-clamp-2 text-base-content/70 text-sm leading-relaxed">
              {listing.description}
            </p>
          )}

          {/* Footer Section */}
          <div className="flex items-center justify-between border-base-200 border-t pt-2">
            {/* Publisher Info */}
            <div className="flex items-center gap-2">
              <div className="avatar">
                <div className="w-6 rounded-full">
                  <Image
                    src={
                      listing.publisher.image ?? "/images/default-avatar.png"
                    }
                    alt={listing.publisher.name ?? ""}
                    width={24}
                    height={24}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {listing.publisher.name}
                </span>
                {listing.capacity && (
                  <span className="text-base-content/60 text-xs">
                    限量 {listing.capacity} 份
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
