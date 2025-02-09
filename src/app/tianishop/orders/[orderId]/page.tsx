import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { thumbHashToDataURL } from "thumbhash";
import { api } from "~/trpc/server";
import { CancelOrderButton } from "../../my/orders/CancelOrderButton";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await api.tianiShop.getOrder({
    id: parseInt(orderId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">訂單詳情</h1>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600">
              訂單時間：{format(order.createdAt, "PPP p", { locale: zhTW })}
            </p>
            <div>
              <span
                className={`badge ${order.status === "CANCELLED" ? "badge-error" : "badge-success"}`}
              >
                {order.status === "CANCELLED" ? "已取消" : "進行中"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {order.status === "PENDING" && (
            <CancelOrderButton orderId={order.id} />
          )}
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
                <p className="text-sm text-gray-600">
                  單價：NT$ {item.snapshot.price.toLocaleString()}
                </p>
                {item.snapshot.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {item.snapshot.description}
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  數量：{item.quantity}
                </div>
                <div className="font-semibold">
                  NT$ {item.subtotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-base-200 p-4">
        <h2 className="text-lg font-semibold">訂單摘要</h2>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>小計</span>
            <span>NT$ {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>運費</span>
            <span>免費</span>
          </div>
          <div className="border-t border-base-300 pt-2">
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
