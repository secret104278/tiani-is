import { isNil, sum } from "lodash";
import { z } from "zod";
import { isValidQrToken } from "~/config/checkin";
import {
  activityIsOnGoing,
  differenceInHoursNoRound,
  isOutOfRange,
} from "~/utils/ui";
import {
  activityManageProcedure,
  activityRepresentableProcedure,
  representableProcedure,
} from "../../procedures/class";
import { createTRPCRouter } from "../../trpc";

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
        const activity = await ctx.db.classActivity.findUniqueOrThrow({
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

      return await ctx.db.classActivityCheckRecord.upsert({
        where: {
          userId_activityId: {
            userId: ctx.input.userId,
            activityId: input.activityId,
          },
        },
        update: {
          checkAt: now,
          longitude: input.longitude,
          latitude: input.latitude,
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
          checkAt: now,
          longitude: input.longitude,
          latitude: input.latitude,
        },
      });
    }),

  isCheckedIn: activityRepresentableProcedure.query(async ({ ctx, input }) => {
    const checkRecord = await ctx.db.classActivityCheckRecord.findUnique({
      select: { id: true },
      where: {
        userId_activityId: {
          userId: ctx.input.userId,
          activityId: input.activityId,
        },
      },
    });

    return !isNil(checkRecord);
  }),

  getActivityCheckRecords: activityManageProcedure.query(({ ctx, input }) =>
    ctx.db.classActivityCheckRecord.findMany({
      where: {
        activityId: input.activityId,
      },
      include: {
        user: true,
      },
    }),
  ),

  getWorkingStats: representableProcedure.query(async ({ ctx }) => {
    const activityCheckHistories =
      await ctx.db.classActivityCheckRecord.findMany({
        select: {
          activityId: true,
          activity: {
            select: {
              title: true,
              startDateTime: true,
              endDateTime: true,
            },
          },
          checkAt: true,
        },
        where: {
          userId: ctx.input.userId,
        },
        orderBy: {
          checkAt: "desc",
        },
      });

    const totalWorkingHours = sum(
      activityCheckHistories.map((record) =>
        differenceInHoursNoRound(
          record.activity.endDateTime,
          record.activity.startDateTime,
        ),
      ),
    );

    return {
      activityCheckHistories,
      totalWorkingHours,
    };
  }),
});
