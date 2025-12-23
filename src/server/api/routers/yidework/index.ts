import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { locationRouter } from "./location";
import { qiudaorenRouter } from "./qiudaoren";

export const yideworkRouter = mergeTRPCRouters(
  activityRouter,
  locationRouter,
  qiudaorenRouter,
);

export type YideWorkRouter = typeof yideworkRouter;
