import { type Prisma } from "@prisma/client";
import { difference, isNil, sum, union } from "lodash";
import { z } from "zod";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  activityIsOnGoing,
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
        ctx.session.user.role.is_yideclass_admin;
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
        participatedByMe: z.boolean().optional(),

        limit: z.number().min(1).max(100).default(10),
        cursor: z.object({ startDateTime: z.date(), id: z.number() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters: Prisma.ClassActivityWhereInput[] = [];
      if (input.participatedByMe) {
        filters.push({
          classActivityCheckRecords: { some: { userId: ctx.session.user.id } },
        });
      }

      const items = await ctx.db.classActivity.findMany({
        where: filters.length === 0 ? undefined : { OR: filters },
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
          ctx.session.user.role.is_yideclass_admin);

      if (res?.status !== "PUBLISHED" && !isManager) return { activity: null };

      return { activity: res };
    }),

  deleteActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const orgActivity = await ctx.db.classActivity.findUniqueOrThrow({
        select: { status: true, organiserId: true },
        where: {
          id: input.id,
        },
      });

      const isManager =
        ctx.session.user.id === orgActivity.organiserId ||
        ctx.session.user.role.is_yideclass_admin;
      if (!isManager) throw new Error("只有管理員可以刪除活動");

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

      const now = new Date();
      if (
        !activityIsOnGoing(activity.startDateTime, activity.endDateTime, now)
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

  manualCheckInActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_yideclass_admin)
        throw new Error("只有管理員可以手動簽到");

      const now = new Date();

      await ctx.db.classActivityCheckRecord.upsert({
        where: {
          userId_activityId: {
            userId: input.userId,
            activityId: input.activityId,
          },
        },
        update: {
          checkAt: now,
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
          checkAt: now,
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
        !ctx.session.user.role.is_yideclass_admin &&
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

  takeLeave: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_yideclass_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以幫別人請假");

      const userId = input.userId ?? ctx.session.user.id;

      await ctx.db.classActivityLeaveRecord.upsert({
        where: {
          userId_activityId: {
            userId: userId,
            activityId: input.activityId,
          },
        },
        update: {},
        create: {
          user: {
            connect: {
              id: userId,
            },
          },
          activity: {
            connect: {
              id: input.activityId,
            },
          },
        },
      });
    }),

  cancelLeave: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_yideclass_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以幫別人取消請假");

      const userId = input.userId ?? ctx.session.user.id;

      await ctx.db.classActivityLeaveRecord.deleteMany({
        where: {
          userId: userId,
          activityId: input.activityId,
        },
      });
    }),

  getActivityLeaveRecords: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.classActivityLeaveRecord.findMany({
        include: {
          user: true,
        },
        where: {
          activityId: input.activityId,
        },
      });
    }),

  isLeaved: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_yideclass_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以查看別人是否請假");

      const leaveRecord = await ctx.db.classActivityLeaveRecord.findUnique({
        where: {
          userId_activityId: {
            userId: input.userId ?? ctx.session.user.id,
            activityId: input.activityId,
          },
        },
      });

      return !isNil(leaveRecord);
    }),

  getActivitiesByTitle: protectedProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_yideclass_admin)
        throw new Error("只有管理員可以");

      const [enrollments, classActivities] = await Promise.all([
        await ctx.db.classMemberEnrollment.findMany({
          where: {
            classTitle: input.title,
          },
          select: {
            userId: true,
          },
        }),
        await ctx.db.classActivity.findMany({
          where: {
            title: input.title,
          },
          include: {
            classActivityCheckRecords: {
              select: {
                userId: true,
              },
            },
            classActivityLeaveRecords: {
              select: {
                userId: true,
              },
            },
          },
        }),
      ]);

      const enrolledUserIds = enrollments.map((e) => e.userId);

      return classActivities.map((activity) => {
        const checkedInUserIds = activity.classActivityCheckRecords.map(
          (record) => record.userId,
        );
        const leavedUserIds = activity.classActivityLeaveRecords.map(
          (record) => record.userId,
        );

        const checkInUserCount = checkedInUserIds.length;
        const leaveUserCount = leavedUserIds.length;
        const absentUserCount = difference(
          enrolledUserIds,
          union(checkedInUserIds, leavedUserIds),
        ).length;

        return {
          ...activity,
          checkInUserCount,
          leaveUserCount,
          absentUserCount,
        };
      });
    }),

  enrollClass: protectedProcedure
    .input(
      z.object({
        classTitle: z.string(),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_yideclass_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以幫別人註冊課程");

      const userId = input.userId ?? ctx.session.user.id;
      await ctx.db.classMemberEnrollment.upsert({
        where: {
          userId_classTitle: {
            userId,
            classTitle: input.classTitle,
          },
        },
        update: {},
        create: {
          user: {
            connect: {
              id: userId,
            },
          },
          classTitle: input.classTitle,
        },
      });
    }),

  unenrollClass: protectedProcedure
    .input(
      z.object({
        classTitle: z.string(),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_yideclass_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以幫別人取消註冊課程");

      const userId = input.userId ?? ctx.session.user.id;
      await ctx.db.classMemberEnrollment.deleteMany({
        where: {
          userId,
          classTitle: input.classTitle,
        },
      });
    }),

  getClassMemberEnrollments: protectedProcedure
    .input(
      z.object({
        classTitle: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_yideclass_admin)
        throw new Error("只有管理員可以查看課程報名名單");

      return await ctx.db.classMemberEnrollment.findMany({
        where: {
          classTitle: input.classTitle,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }),
});
