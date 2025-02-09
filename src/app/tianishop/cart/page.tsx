import { api } from "~/trpc/server";
import { CartItemCard } from "./CartItemCard";
import { CheckoutButton } from "./CheckoutButton";

export default async function CartPage() {
  const cart = await api.tianiShop.getCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">購物車是空的</h1>
          <p className="mt-2 text-sm text-gray-600">快去逛逛吧！</p>
          <a href="/tianishop" className="btn btn-primary btn-sm mt-4">
            回到商店
          </a>
        </div>
      </div>
    );
  }

  // Calculate total
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.listing.price,
    0,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">購物車</h1>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </div>

      <div className="rounded-lg bg-base-200 p-4">
        <h2 className="text-lg font-semibold">訂單摘要</h2>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>小計</span>
            <span>NT$ {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>運費</span>
            <span>免費</span>
          </div>
          <div className="border-t border-base-300 pt-2">
            <div className="flex justify-between font-semibold">
              <span>總計</span>
              <span>NT$ {subtotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <CheckoutButton cartId={cart.id} />
        </div>
      </div>
    </div>
  );
}
