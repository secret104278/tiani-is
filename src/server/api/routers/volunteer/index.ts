import { mergeTRPCRouters } from "../../trpc";
import { activityRouter } from "./activity";
import { adminRouter } from "./admin";
import { checkinRouter } from "./checkin";
import { participateRouter } from "./participate";

export const volunteerRouter = mergeTRPCRouters(
  activityRouter,
  adminRouter,
  checkinRouter,
  participateRouter,
);
