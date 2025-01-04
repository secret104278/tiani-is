import {
  activityManageProcedure,
  activityRepresentableProcedure,
} from "../../procedures/yideclass";
import { createTRPCRouter } from "../../trpc";

export const leaveRouter = createTRPCRouter({
  takeLeave: activityRepresentableProcedure.mutation(({ ctx, input }) =>
    ctx.db.classActivityLeaveRecord.upsert({
      where: {
        userId_activityId: {
          userId: ctx.input.userId,
          activityId: input.activityId,
        },
      },
      update: {},
      create: {
        user: {
          connect: {
            id: ctx.input.userId,
          },
        },
        activity: {
          connect: {
            id: input.activityId,
          },
        },
      },
    }),
  ),

  cancelLeave: activityRepresentableProcedure.mutation(({ ctx, input }) =>
    ctx.db.classActivityLeaveRecord.deleteMany({
      where: {
        userId: ctx.input.userId,
        activityId: input.activityId,
      },
    }),
  ),

  getActivityLeaveRecords: activityManageProcedure.query(({ ctx, input }) =>
    ctx.db.classActivityLeaveRecord.findMany({
      include: {
        user: true,
      },
      where: {
        activityId: input.activityId,
      },
    }),
  ),

  isLeaved: activityRepresentableProcedure.query(async ({ ctx, input }) => {
    const leaveRecord = await ctx.db.classActivityLeaveRecord.findUnique({
      select: { id: true },
      where: {
        userId_activityId: {
          userId: input.userId ?? ctx.session.user.id,
          activityId: input.activityId,
        },
      },
    });

    return !!leaveRecord;
  }),
});
