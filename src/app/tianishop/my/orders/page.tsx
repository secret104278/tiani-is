import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { thumbHashToDataURL } from "thumbhash";
import { calculateOrderStatus } from "~/server/api/routers/tianishop/utils";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的訂單</h1>
        <Link href="/tianishop" className="btn btn-primary btn-sm">
          回到商店
        </Link>
      </div>

      <div className="flex flex-col space-y-4">
        {orders.map((order) => (
          <Link key={order.id} href={`/tianishop/orders/${order.id}`}>
            <div className="rounded-lg bg-base-100 p-4 shadow-sm transition hover:shadow-md">
              <div className="flex gap-4">
                <div className="relative block aspect-square w-24 shrink-0 overflow-hidden rounded-lg">
                  {order.items[0]?.snapshot.imageKey &&
                    order.items[0]?.snapshot.thumbhash && (
                      <Image
                        src={order.items[0].snapshot.imageKey}
                        alt={order.items[0].snapshot.title}
                        fill
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={thumbHashToDataURL(
                          Buffer.from(
                            order.items[0].snapshot.thumbhash,
                            "base64",
                          ),
                        )}
                      />
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {order.items[0]?.snapshot.title}
                        {order.items.length > 1 &&
                          ` +${order.items.length - 1} 件商品`}
                      </h3>
                      {(() => {
                        const orderStatus = calculateOrderStatus(order.items);
                        return (
                          <span
                            className={`badge ${
                              orderStatus === "COMPLETED"
                                ? "badge-success"
                                : orderStatus === "CANCELLED"
                                  ? "badge-error"
                                  : "badge-info"
                            }`}
                          >
                            {orderStatus === "COMPLETED"
                              ? "已完成"
                              : orderStatus === "CANCELLED"
                                ? "已取消"
                                : "進行中"}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-gray-600">
                      NT$ {order.total.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <div className="text-sm text-gray-600">
                      訂單時間：
                      {format(order.createdAt, "PPP p", { locale: zhTW })}
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
