import { mergeTRPCRouters } from "~/server/api/trpc";
import { listingRouter } from "./listing";

export const tianiShopRouter = mergeTRPCRouters(listingRouter);

export type TianiShopRouter = typeof tianiShopRouter;
