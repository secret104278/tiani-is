import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const presetRouter = createTRPCRouter({
  getPresets: protectedProcedure.query(({ ctx }) =>
    ctx.db.yideWorkPreset.findMany({}),
  ),
});
