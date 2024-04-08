import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { locationRouter } from "./location";
import { presetRouter } from "./preset";
import { registerRouter } from "./register";

export const yideworkRouter = mergeTRPCRouters(
  activityRouter,
  locationRouter,
  presetRouter,
  registerRouter,
);

export type YideWorkRouter = typeof yideworkRouter;
