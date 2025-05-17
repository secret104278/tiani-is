import { z } from "zod";
import { calculateTotalWorkingHours } from "../../../../utils/volunteer";
import {
  activityManageProcedure,
  adminProcedure,
} from "../../procedures/volunteer";
import { createTRPCRouter } from "../../trpc";

export const adminRouter = createTRPCRouter({
  getActivityCheckRecords: activityManageProcedure.query(({ ctx, input }) =>
    ctx.db.volunteerActivityCheckRecord.findMany({
      select: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        activityId: true,
        checkInAt: true,
        checkOutAt: true,
      },
      where: {
        activityId: input.activityId,
      },
    }),
  ),

  managerCheckInActivity: activityManageProcedure
    .input(
      z.object({
        userId: z.string(),
        checkInAt: z.date(),
        checkOutAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.checkInAt >= input.checkOutAt) {
        throw new Error("簽退時間必須晚於簽到時間");
      }

      return await ctx.db.volunteerActivityCheckRecord.upsert({
        where: {
          userId_activityId: {
            userId: input.userId,
            activityId: input.activityId,
          },
        },
        create: {
          user: {
            connect: {
              id: input.userId,
            },
          },
          activity: {
            connect: {
              id: input.activityId,
            },
          },

          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
        update: {
          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
      });
    }),

  modifyCasualCheckRecord: adminProcedure
    .input(
      z.object({
        id: z.number(),
        userId: z.string(),
        checkInAt: z.date(),
        checkOutAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.checkInAt > input.checkOutAt) {
        throw new Error("簽退時間必須晚於簽到時間");
      }

      if (input.checkInAt.getTime() === input.checkOutAt.getTime()) {
        await ctx.db.casualCheckRecord.delete({
          where: {
            id: input.id,
          },
        });
        return;
      }

      await ctx.db.casualCheckRecord.update({
        where: {
          id: input.id,
        },
        data: {
          user: {
            connect: {
              id: input.userId,
            },
          },

          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
      });
    }),

  manualCasualCheckRecord: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        checkInAt: z.date(),
        checkOutAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.checkInAt >= input.checkOutAt) {
        throw new Error("簽退時間必須晚於簽到時間");
      }

      await ctx.db.casualCheckRecord.create({
        data: {
          user: {
            connect: {
              id: input.userId,
            },
          },

          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
      });
    }),

  getUsersWithWorkingStatsByCheckIn: adminProcedure
    .input(
      z.object({
        start: z.date().optional(),
        end: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          casualCheckRecords: {
            select: {
              checkInAt: true,
              checkOutAt: true,
            },
          },
          volunteerActivityCheckRecords: {
            select: {
              checkInAt: true,
              checkOutAt: true,
            },
          },
        },
        ...(input.start && input.end
          ? {
              where: {
                OR: [
                  {
                    casualCheckRecords: {
                      some: {
                        checkInAt: {
                          gte: input.start,
                          lte: input.end,
                        },
                      },
                    },
                  },
                  {
                    volunteerActivityCheckRecords: {
                      some: {
                        checkInAt: {
                          gte: input.start,
                          lte: input.end,
                        },
                      },
                    },
                  },
                ],
              },
            }
          : {}),
      });

      return users.map((user) => {
        const allRecords = {
          casualCheckRecords: user.casualCheckRecords,
          volunteerActivityCheckRecords: user.volunteerActivityCheckRecords,
        };

        const queryRangeRecords = {
          casualCheckRecords: user.casualCheckRecords.filter(
            (record) =>
              (!input.start || record.checkInAt >= input.start) &&
              (!input.end || record.checkInAt <= input.end),
          ),
          volunteerActivityCheckRecords:
            user.volunteerActivityCheckRecords.filter(
              (record) =>
                (!input.start || record.checkInAt >= input.start) &&
                (!input.end || record.checkInAt <= input.end),
            ),
        };

        return {
          id: user.id,
          name: user.name,
          workingHoursInQueryRange:
            calculateTotalWorkingHours(queryRangeRecords),
          totalWorkingHours: calculateTotalWorkingHours(allRecords),
        };
      });
    }),
});
