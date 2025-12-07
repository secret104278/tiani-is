import { difference, union } from "lodash";
import { z } from "zod";
import type { Prisma } from "~/prisma-client";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
  adminProcedure,
} from "../../procedures/yideclass";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const activityRouter = createTRPCRouter({
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
    .mutation(({ ctx, input }) =>
      ctx.db.classActivity.create({
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
      }),
    ),

  getActivity: activityPublishedOnlyProcedure.query(({ ctx, input }) =>
    ctx.db.classActivity.findUniqueOrThrow({
      where: { id: input.activityId },
      include: { organiser: { select: { name: true } } },
    }),
  ),

  updateActivity: activityManageProcedure
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
    .mutation(({ ctx, input }) =>
      ctx.db.classActivity.update({
        where: {
          id: input.activityId,
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
      }),
    ),

  deleteActivity: activityManageProcedure.mutation(({ ctx, input }) =>
    ctx.db.classActivity.delete({
      where: { id: input.activityId },
    }),
  ),

  // TODO: refactor
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

  getActivitiesByTitle: adminProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
});
