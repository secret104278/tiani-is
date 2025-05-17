import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { thumbHashToDataURL } from "thumbhash";
import { calculateOrderStatus } from "~/server/api/routers/tianishop/utils";
import { api } from "~/trpc/server";
import { CancelOrderItemButton } from "./CancelOrderItemButton";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await api.tianiShop.getOrder({
    id: Number.parseInt(orderId),
  });

  const orderStatus = calculateOrderStatus(order.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">訂單詳情</h1>
          <div className="mt-1 space-y-1">
            <p className="text-gray-600 text-sm">
              訂單時間：{format(order.createdAt, "PPP p", { locale: zhTW })}
            </p>
            <div>
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/tianishop" className="btn btn-primary btn-sm">
            回到商店
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-lg bg-base-100 p-3 shadow-sm"
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
                {item.snapshot.description && (
                  <p className="mt-1 line-clamp-2 text-gray-600 text-sm">
                    {item.snapshot.description}
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between">
                <div className="space-x-2">
                  <span className="text-gray-600 text-sm">
                    數量：{item.quantity}
                  </span>
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
                      {format(item.completedAt, "PPP p", { locale: zhTW })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    NT$ {item.subtotal.toLocaleString()}
                  </div>
                  {item.status === "PENDING" && (
                    <CancelOrderItemButton orderItemId={item.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-base-200 p-4">
        <h2 className="font-semibold text-lg">訂單摘要</h2>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>小計</span>
            <span>NT$ {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>運費</span>
            <span>免費</span>
          </div>
          <div className="border-base-300 border-t pt-2">
            <div className="flex justify-between font-semibold">
              <span>總計</span>
              <span>NT$ {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
