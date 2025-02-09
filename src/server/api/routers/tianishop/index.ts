import { mergeTRPCRouters } from "~/server/api/trpc";
import { cartRouter } from "./cart";
import { listingRouter } from "./listing";
import { orderRouter } from "./order";

export const tianiShopRouter = mergeTRPCRouters(
  listingRouter,
  cartRouter,
  orderRouter,
);

export type TianiShopRouter = typeof tianiShopRouter;
