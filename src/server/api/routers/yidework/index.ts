import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { locationRouter } from "./location";
import { registerRouter } from "./register";

export const yideworkRouter = mergeTRPCRouters(
  activityRouter,
  locationRouter,
  registerRouter,
);

export type YideWorkRouter = typeof yideworkRouter;
