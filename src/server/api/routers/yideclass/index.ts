import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { checkinRouter } from "./checkin";
import { enrollRouter } from "./enroll";
import { leaveRouter } from "./leave";

export const yideclassRouter = mergeTRPCRouters(
  activityRouter,
  checkinRouter,
  leaveRouter,
  enrollRouter,
);
