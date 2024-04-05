import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { locationRouter } from "./location";

export const yideworkRouter = mergeTRPCRouters(activityRouter, locationRouter);

export type YideWorkRouter = typeof yideworkRouter;
