import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { checkinRouter } from "./checkin";
import { registerRouter } from "./register";
import { statsRouter } from "./stats";

export const etogetherRouter = mergeTRPCRouters(
  activityRouter,
  checkinRouter,
  registerRouter,
  statsRouter,
);

export type EtogetherRouter = typeof etogetherRouter;
