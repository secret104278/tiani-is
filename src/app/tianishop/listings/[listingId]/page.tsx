import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import { thumbHashToDataURL } from "thumbhash";
import LineImage from "~/app/components/line-image";
import { api } from "~/trpc/server";
import { AddToCartButton } from "./AddToCartButton";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const listing = await api.tianiShop.getListing({
    id: parseInt(listingId),
  });

  if (!listing) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">404</h1>
          <p className="mt-2 text-sm text-gray-600">商品不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        {listing.images[0] && (
          <Image
            src={listing.images[0]?.key}
            alt={listing.title}
            fill
            className="object-cover"
            placeholder="blur"
            blurDataURL={thumbHashToDataURL(
              Buffer.from(listing.images[0]?.thumbhash, "base64"),
            )}
          />
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <LineImage
                src={listing.publisher.image ?? ""}
                alt={listing.publisher.name ?? ""}
              />
            </div>
          </div>
          <div>
            <p className="font-semibold">{listing.publisher.name}</p>
            <p className="text-sm text-gray-600">
              {format(listing.createdAt, "PPP", { locale: zhTW })}
            </p>
          </div>
        </div>
        <div className="divider"></div>
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <div className="mt-2">
            <span className="badge badge-primary badge-lg">
              {listing.price === 0
                ? "免費"
                : `NT$ ${listing.price.toLocaleString()}`}
            </span>
          </div>
        </div>
        {listing.startTime && (
          <div className="flex items-center gap-2">
            <span className="font-semibold">開始時間:</span>
            <span className="text-sm">
              {format(listing.startTime, "PPP p", { locale: zhTW })}
            </span>
          </div>
        )}
        {listing.endTime && (
          <div className="flex items-center gap-2">
            <span className="font-semibold">結束時間:</span>
            <span className="text-sm">
              {format(listing.endTime, "PPP p", { locale: zhTW })}
            </span>
          </div>
        )}
        {listing.capacity && (
          <div>
            <span className="font-semibold">剩餘數量:</span>{" "}
            <span className="text-sm">{listing.capacity}</span>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold">商品描述</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
            {listing.description}
          </p>
        </div>

        <div>
          <AddToCartButton listingId={listing.id} />
        </div>
      </div>
    </div>
  );
}
