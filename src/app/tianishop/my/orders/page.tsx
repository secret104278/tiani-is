import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { thumbHashToDataURL } from "thumbhash";
import { api } from "~/trpc/server";

export default async function MyOrdersPage() {
  const orders = await api.tianiShop.getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">尚無訂單</h1>
          <p className="mt-2 text-sm text-gray-600">快去逛逛吧！</p>
          <Link href="/tianishop" className="btn btn-primary btn-sm mt-4">
            回到商店
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的訂單</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/tianishop/orders/${order.id}`}
            className="block"
          >
            <div className="rounded-lg bg-base-100 p-4 shadow-sm transition hover:shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  訂單時間：
                  {format(order.createdAt, "PPP p", { locale: zhTW })}
                </div>
                <div className="font-semibold">
                  NT$ {order.total.toLocaleString()}
                </div>
              </div>

              <div className="flex gap-4 overflow-auto">
                {order.items.map((item) => (
                  <div key={item.id} className="flex shrink-0 gap-3 first:ml-0">
                    <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg">
                      {item.snapshot.imageKey && item.snapshot.thumbhash && (
                        <Image
                          src={item.snapshot.imageKey}
                          alt={item.snapshot.title}
                          fill
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL={thumbHashToDataURL(
                            Buffer.from(item.snapshot.thumbhash, "base64"),
                          )}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {item.snapshot.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        x{item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
