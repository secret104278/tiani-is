import { leaveActivityEventQueue } from "~/server/queue/leaveActivity";
import { participateActivityEventQueue } from "~/server/queue/participateActivity";
import { activityRepresentableProcedure } from "../../procedures/volunteer";
import { createTRPCRouter } from "../../trpc";

export const participateRouter = createTRPCRouter({
  participateActivity: activityRepresentableProcedure.mutation(
    async ({ ctx, input }) => {
      const res = await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          participants: {
            connect: {
              id: ctx.input.userId,
            },
          },
        },
      });

      void participateActivityEventQueue.push({
        activityId: input.activityId,
        userId: ctx.input.userId,
      });

      return res;
    },
  ),

  leaveActivity: activityRepresentableProcedure.mutation(
    async ({ ctx, input }) => {
      const res = await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          participants: {
            disconnect: {
              id: ctx.input.userId,
            },
          },
        },
      });

      void leaveActivityEventQueue.push({
        activityId: input.activityId,
        userId: ctx.input.userId,
      });

      return res;
    },
  ),
});
