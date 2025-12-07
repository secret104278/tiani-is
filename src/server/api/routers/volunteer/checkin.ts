import { TZDate } from "@date-fns/tz";
import { startOfDay } from "date-fns";
import { isNil } from "lodash";
import { z } from "zod";
import { isValidQrToken } from "~/config/checkin";
import { activityIsOnGoing, isOutOfRange } from "~/utils/ui";
import { calculateTotalWorkingHours } from "../../../../utils/volunteer";
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
        qrToken: z.string().optional(),
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

        const hasValidGeo =
          !isNil(input.latitude) &&
          !isNil(input.longitude) &&
          !isOutOfRange(input.latitude, input.longitude);

        const hasValidQr =
          !isNil(input.qrToken) && isValidQrToken(input.qrToken);

        if (!hasValidGeo && !hasValidQr) {
          if (isNil(input.latitude) || isNil(input.longitude))
            throw new Error("無法取得位置資訊");
          throw new Error("超出打卡範圍");
        }
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
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        qrToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasValidGeo =
        !isNil(input.latitude) &&
        !isNil(input.longitude) &&
        !isOutOfRange(input.latitude, input.longitude);

      const hasValidQr = !isNil(input.qrToken) && isValidQrToken(input.qrToken);

      if (!hasValidGeo && !hasValidQr) throw new Error("超出打卡範圍");

      const now = TZDate.tz("Asia/Taipei");
      const todayStart = startOfDay(now);

      const latestCheck = await ctx.db.casualCheckRecord.findFirst({
        select: { id: true, checkOutAt: true },
        where: {
          userId: ctx.session.user.id,
          checkInAt: {
            gte: todayStart,
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
    const [activityCheckHistories, casualCheckHistories] = await Promise.all([
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
      }),
      ctx.db.casualCheckRecord.findMany({
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
      }),
    ]);

    const totalWorkingHours = calculateTotalWorkingHours({
      casualCheckRecords: casualCheckHistories,
      volunteerActivityCheckRecords: activityCheckHistories,
    });

    return {
      activityCheckHistories,
      casualCheckHistories,
      totalWorkingHours,
    };
  }),

  getLatestCasualCheckIn: protectedProcedure.query(async ({ ctx }) => {
    const todayStart = startOfDay(TZDate.tz("Asia/Taipei"));

    return await ctx.db.casualCheckRecord.findFirst({
      where: {
        userId: ctx.session.user.id,
        checkInAt: {
          gte: todayStart,
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
