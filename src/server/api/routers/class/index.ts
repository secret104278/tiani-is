import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { checkinRouter } from "./checkin";
import { enrollRouter } from "./enroll";
import { leaveRouter } from "./leave";

export const classRouter = mergeTRPCRouters(
  activityRouter,
  checkinRouter,
  leaveRouter,
  enrollRouter,
);

export type ClassRouter = typeof classRouter;
