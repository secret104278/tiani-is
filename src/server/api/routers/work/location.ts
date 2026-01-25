import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const locationRouter = createTRPCRouter({
  getLocations: protectedProcedure.query(({ ctx }) =>
    ctx.db.yideWorkLocation.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ),
});
