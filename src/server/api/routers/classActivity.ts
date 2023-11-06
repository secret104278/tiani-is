import { isNil, sum } from "lodash";
import { z } from "zod";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  getDistance,
} from "~/utils/ui";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const classActivityRouter = createTRPCRouter({
  createActivity: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        location: z.string(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        isDraft: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.classActivity.create({
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          status: input.isDraft ? "DRAFT" : "PUBLISHED",
          organiser: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
        include: {
          organiser: true,
        },
      });

      return activity;
    }),

  updateActivity: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().nullable(),
        location: z.string(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        isDraft: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgActivity = await ctx.db.classActivity.findUniqueOrThrow({
        select: { status: true, organiserId: true },
        where: {
          id: input.id,
        },
      });

      const isManager =
        ctx.session.user.id === orgActivity.organiserId ||
        ctx.session.user.role === "ADMIN";
      if (!isManager) throw new Error("只有管理員可以修改活動");

      const res = await ctx.db.classActivity.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          status: input.isDraft ? "DRAFT" : undefined,
          version: {
            increment: 1,
          },
        },
      });

      return res;
    }),

  getAllActivitiesInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.object({ startDateTime: z.date(), id: z.number() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.classActivity.findMany({
        orderBy: { startDateTime: "desc" },

        take: input.limit + 1,
        cursor: input.cursor
          ? { startDateTime: input.cursor.startDateTime, id: input.cursor.id }
          : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = {
          startDateTime: nextItem!.startDateTime,
          id: nextItem!.id,
        };
      }

      return { items, nextCursor };
    }),

  getActivity: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const res = await ctx.db.classActivity.findUnique({
        where: { id: input.id },
        include: {
          organiser: true,
        },
      });

      const isManager =
        res &&
        (ctx.session.user.id === res.organiserId ||
          ctx.session.user.role === "ADMIN");

      if (res?.status !== "PUBLISHED" && !isManager) return { activity: null };

      return { activity: res };
    }),

  deleteActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.classActivity.delete({
        where: { id: input.id },
      });
    }),

  checkInActivity: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.classActivity.findUniqueOrThrow({
        where: { id: input.activityId },
      });

      const TWO_HOUR = 2 * 60 * 60 * 1000;
      const now = new Date();
      if (
        now.getUTCMilliseconds() - activity.startDateTime.getUTCMilliseconds() <
          -TWO_HOUR ||
        now.getUTCMilliseconds() - activity.endDateTime.getUTCMilliseconds() >
          TWO_HOUR
      ) {
        throw new Error("非課程時間，無法簽到");
      }

      const isOutOfRange = !TIANI_GPS_CENTERS.some(
        (center) =>
          getDistance(input.latitude, input.longitude, center[0], center[1]) <=
          TIANI_GPS_RADIUS_KM,
      );
      if (isOutOfRange) throw new Error("超出打卡範圍");

      const checkin = await ctx.db.classActivityCheckRecord.findFirst({
        where: {
          activityId: input.activityId,
          userId: ctx.session.user.id,
        },
      });

      if (checkin) {
        await ctx.db.classActivityCheckRecord.upsert({
          where: {
            id: checkin.id,
          },
          update: {
            checkAt: now,
            latitude: input.latitude,
            longitude: input.longitude,
          },
          create: {
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            activity: {
              connect: {
                id: input.activityId,
              },
            },

            checkAt: now,
            latitude: input.latitude,
            longitude: input.longitude,
          },
        });
      } else {
        await ctx.db.classActivityCheckRecord.create({
          data: {
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            activity: {
              connect: {
                id: input.activityId,
              },
            },
            checkAt: now,
            latitude: input.latitude,
            longitude: input.longitude,
          },
        });
      }
    }),

  getCheckInActivityHistory: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.classActivityCheckRecord.findUnique({
        where: {
          userId_activityId: {
            userId: ctx.session.user.id,
            activityId: input.activityId,
          },
        },
      });
    }),

  getActivityCheckRecords: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.classActivityCheckRecord.findMany({
        where: {
          activityId: input.activityId,
        },
        include: {
          user: true,
        },
      });
    }),

  getWorkingStats: protectedProcedure
    .input(
      z.object({
        userId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "ADMIN" &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以查看其他人的工時");

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
            userId: input.userId ?? ctx.session.user.id,
          },
          orderBy: {
            checkAt: "desc",
          },
        });

      const activityWorkingHours = sum(
        activityCheckHistories.map(
          (record) =>
            (record.activity.endDateTime.getTime() -
              record.activity.startDateTime.getTime()) /
            1000 /
            60 /
            60,
        ),
      );

      const totalWorkingHours = activityWorkingHours;

      return {
        activityCheckHistories,
        totalWorkingHours,
      };
    }),
});
