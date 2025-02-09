import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { thumbHashToDataURL } from "thumbhash";
import { api } from "~/trpc/server";
import { DeleteListingButton } from "./DeleteListingButton";

export default async function MyListingsPage() {
  const listings = await api.tianiShop.getMyListings();

  if (listings.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">尚無商品</h1>
          <p className="mt-2 text-sm text-gray-600">開始建立你的第一個商品！</p>
          <Link
            href="/tianishop/listings/new"
            className="btn btn-primary btn-sm mt-4"
          >
            建立商品
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的商品</h1>
        <div className="flex gap-2">
          <Link
            href="/tianishop/my/listings/orders"
            className="btn btn-outline btn-sm"
          >
            查看訂單
          </Link>
          <Link
            href="/tianishop/listings/new"
            className="btn btn-primary btn-sm"
          >
            建立商品
          </Link>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        {listings.map((listing) => (
          <Link key={listing.id} href={`/tianishop/listings/${listing.id}`}>
            <div className="rounded-lg bg-base-100 p-4 shadow-sm transition hover:shadow-md">
              <div className="flex gap-4">
                <div className="relative block aspect-square w-24 shrink-0 overflow-hidden rounded-lg">
                  {listing.images[0] && (
                    <Image
                      src={listing.images[0].key}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={thumbHashToDataURL(
                        Buffer.from(listing.images[0].thumbhash, "base64"),
                      )}
                    />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div>
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-gray-600">
                      NT$ {listing.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        建立時間：
                        {format(listing.createdAt, "PPP", { locale: zhTW })}
                      </div>
                      {listing.capacity && (
                        <div className="text-sm text-gray-600">
                          限量 {listing.capacity} 份
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/tianishop/listings/${listing.id}/edit`}
                        className="btn btn-outline btn-sm"
                      >
                        編輯
                      </Link>
                      <DeleteListingButton listingId={listing.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
