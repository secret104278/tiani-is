import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { locationRouter } from "./location";
import { presetRouter } from "./preset";
import { qiudaorenRouter } from "./qiudaoren";

export const yideworkRouter = mergeTRPCRouters(
  activityRouter,
  locationRouter,
  presetRouter,
  qiudaorenRouter,
);

export type YideWorkRouter = typeof yideworkRouter;
