import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { locationRouter } from "./location";
import { presetRouter } from "./preset";
import { qiudaorenRouter } from "./qiudaoren";
import { registerRouter } from "./register";

export const yideworkRouter = mergeTRPCRouters(
  activityRouter,
  locationRouter,
  presetRouter,
  registerRouter,
  qiudaorenRouter,
);

export type YideWorkRouter = typeof yideworkRouter;
