import { isNil, sum } from "lodash";
import moment from "moment-timezone";
import { z } from "zod";
import {
  activityIsOnGoing,
  differenceInHoursNoRound,
  isOutOfRange,
} from "~/utils/ui";
import {
  activityRepresentableProcedure,
  representableProcedure,
} from "../../procedures/volunteer";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const checkinRouter = createTRPCRouter({
  checkInActivity: activityRepresentableProcedure
    .input(
      z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      if (!ctx.isManager) {
        const activity = await ctx.db.volunteerActivity.findUniqueOrThrow({
          where: { id: input.activityId },
          select: { startDateTime: true, endDateTime: true },
        });

        if (
          !activityIsOnGoing(activity.startDateTime, activity.endDateTime, now)
        )
          throw new Error("非課程時間，無法簽到");

        if (isNil(input.latitude) || isNil(input.longitude))
          throw new Error("無法取得位置資訊");

        if (isOutOfRange(input.latitude, input.longitude))
          throw new Error("超出打卡範圍");
      }

      return await ctx.db.volunteerActivityCheckRecord.upsert({
        where: {
          userId_activityId: {
            activityId: input.activityId,
            userId: ctx.input.userId,
          },
        },
        update: {
          checkOutAt: now,
          checkOutLatitude: input.latitude,
          checkOutLongitude: input.longitude,
        },
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

          checkInAt: now,
          checkInLatitude: input.latitude,
          checkInLongitude: input.longitude,
        },
      });
    }),

  casualCheckIn: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (isOutOfRange(input.latitude, input.longitude))
        throw new Error("超出打卡範圍");

      const taipeiMoment = moment.tz("Asia/Taipei");
      const now = taipeiMoment.clone().tz(moment.tz.guess()).toDate();

      taipeiMoment.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      const targetMoment = taipeiMoment.clone().tz(moment.tz.guess());

      // TODO: lock or transaction
      const latestCheck = await ctx.db.casualCheckRecord.findFirst({
        select: { id: true, checkOutAt: true },
        where: {
          userId: ctx.session.user.id,
          checkInAt: {
            gte: targetMoment.toDate(),
          },
        },
        orderBy: {
          checkInAt: "desc",
        },
      });

      if (latestCheck?.checkOutAt === null) {
        await ctx.db.casualCheckRecord.update({
          where: {
            id: latestCheck.id,
          },
          data: {
            checkOutAt: now,
            checkOutLatitude: input.latitude,
            checkOutLongitude: input.longitude,
          },
        });
      } else {
        await ctx.db.casualCheckRecord.create({
          data: {
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            checkInAt: now,
            checkInLatitude: input.latitude,
            checkInLongitude: input.longitude,
          },
        });
      }
    }),

  getWorkingStats: representableProcedure.query(async ({ ctx }) => {
    const activityCheckHistoriesPromise =
      ctx.db.volunteerActivityCheckRecord.findMany({
        select: {
          activityId: true,
          activity: {
            select: {
              title: true,
              startDateTime: true,
            },
          },
          checkInAt: true,
          checkOutAt: true,
        },
        where: {
          userId: ctx.input.userId,

          checkOutAt: { not: null },
        },
        orderBy: {
          activity: {
            startDateTime: "desc",
          },
        },
      });

    const casualCheckHistoriesPromise = ctx.db.casualCheckRecord.findMany({
      select: {
        id: true,
        checkInAt: true,
        checkOutAt: true,
      },
      where: {
        userId: ctx.input.userId,
      },
      orderBy: {
        checkInAt: "desc",
      },
    });

    const [activityCheckHistories, casualCheckHistories] = await Promise.all([
      activityCheckHistoriesPromise,
      casualCheckHistoriesPromise,
    ]);

    const activityWorkingHours = sum(
      activityCheckHistories.map((record) =>
        differenceInHoursNoRound(record.checkOutAt!, record.checkInAt),
      ),
    );

    const casualWorkingHours = sum(
      casualCheckHistories
        .filter((record) => !isNil(record.checkOutAt))
        .map((record) =>
          differenceInHoursNoRound(record.checkOutAt!, record.checkInAt),
        ),
    );

    const totalWorkingHours = activityWorkingHours + casualWorkingHours;

    return {
      activityCheckHistories,
      casualCheckHistories,
      totalWorkingHours,
    };
  }),

  getLatestCasualCheckIn: protectedProcedure.query(async ({ ctx }) => {
    const taipeiMoment = moment.tz("Asia/Taipei");
    taipeiMoment.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const targetMoment = taipeiMoment.clone().tz(moment.tz.guess());

    return await ctx.db.casualCheckRecord.findFirst({
      where: {
        userId: ctx.session.user.id,
        checkInAt: {
          gte: targetMoment.toDate(),
        },
      },
      orderBy: {
        checkInAt: "desc",
      },
    });
  }),

  getCheckInActivityHistory: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.volunteerActivityCheckRecord.findUnique({
        where: {
          userId_activityId: {
            userId: ctx.session.user.id,
            activityId: input.activityId,
          },
        },
      });
    }),
});
