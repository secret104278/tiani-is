import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import { thumbHashToDataURL } from "thumbhash";
import { calculateOrderStatus } from "~/server/api/routers/tianishop/utils";
import { api } from "~/trpc/server";
import { CancelOrderItemButton } from "./CancelOrderItemButton";
import { CompleteOrderItemButton } from "./CompleteOrderItemButton";

export default async function MyListingOrdersPage() {
  const orders = await api.tianiShop.getMyListingOrders();

  if (orders.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="font-bold text-2xl">尚無訂單</h1>
          <p className="mt-2 text-gray-600 text-sm">等待買家下單！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">我的商品訂單</h1>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          // Filter items for this publisher
          const publisherItems = order.items.filter(
            (item) => item.listing.publisherId === order.user.id,
          );

          const orderStatus = calculateOrderStatus(publisherItems);

          return (
            <div key={order.id} className="rounded-lg bg-base-100 p-4 shadow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">
                    訂單時間：
                    {format(order.createdAt, "PPP p", { locale: zhTW })}
                  </p>
                  <p className="text-gray-600 text-sm">
                    訂購人：{order.user.name ?? "未知"}
                  </p>
                  <div className="mt-1">
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
                          : "處理中"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {publisherItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-lg bg-base-200 p-3"
                  >
                    <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg">
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

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div>
                        <h3 className="truncate font-semibold">
                          {item.snapshot.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          單價：NT$ {item.snapshot.price.toLocaleString()}
                        </p>
                        <p className="text-gray-600 text-sm">
                          數量：{item.quantity}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="space-x-2">
                          <span
                            className={`badge ${
                              item.status === "COMPLETED"
                                ? "badge-success"
                                : item.status === "CANCELLED"
                                  ? "badge-error"
                                  : "badge-info"
                            }`}
                          >
                            {item.status === "COMPLETED"
                              ? "已完成"
                              : item.status === "CANCELLED"
                                ? "已取消"
                                : "處理中"}
                          </span>
                          {item.completedAt && (
                            <span className="text-gray-600 text-sm">
                              完成時間：
                              {format(item.completedAt, "PPP p", {
                                locale: zhTW,
                              })}
                            </span>
                          )}
                        </div>
                        {item.status === "PENDING" && (
                          <div className="flex gap-2">
                            <CancelOrderItemButton orderItemId={item.id} />
                            <CompleteOrderItemButton orderItemId={item.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
