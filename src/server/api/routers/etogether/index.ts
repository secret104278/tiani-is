import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { checkinRouter } from "./checkin";
import { registerRouter } from "./register";

export const etogetherRouter = mergeTRPCRouters(
  activityRouter,
  checkinRouter,
  registerRouter,
);

export type EtogetherRouter = typeof etogetherRouter;
