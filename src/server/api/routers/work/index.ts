import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { locationRouter } from "./location";
import { qiudaorenRouter } from "./qiudaoren";

export const workRouter = mergeTRPCRouters(
  activityRouter,
  locationRouter,
  qiudaorenRouter,
);

export type WorkRouter = typeof workRouter;
