import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { classRouter } from "./routers/class";
import { etogetherRouter } from "./routers/etogether";
import { tianiShopRouter } from "./routers/tianishop";
import { userRouter } from "./routers/user";
import { volunteerRouter } from "./routers/volunteer";
import { workRouter } from "./routers/work";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  volunteerActivity: volunteerRouter,
  classActivity: classRouter,
  workActivity: workRouter,
  etogetherActivity: etogetherRouter,
  user: userRouter,
  tianiShop: tianiShopRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
