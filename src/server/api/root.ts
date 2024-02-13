import { createTRPCRouter } from "~/server/api/trpc";
import { etogetherRouter } from "./routers/etogether";
import { userRouter } from "./routers/user";
import { volunteerActivityRouter } from "./routers/volunteeractivity";
import { yideclassRouter } from "./routers/yideclass";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  volunteerActivity: volunteerActivityRouter,
  classActivity: yideclassRouter,
  etogetherActivity: etogetherRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
