import type { Prisma } from "@prisma/client";
import _ from "lodash";
import { z } from "zod";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
} from "../../procedures/work";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const activityRouter = createTRPCRouter({
  createActivity: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        festival: z.string().nullable().optional(),
        locationId: z.number(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        assignments: z.record(z.any()).optional(),
        isDraft: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.yideWorkActivity.create({
        data: {
          title: input.title,
          description: input.description,
          festival: input.festival,
          location: {
            connect: {
              id: input.locationId,
            },
          },
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          assignments: _.isEmpty(input.assignments)
            ? undefined
            : input.assignments,
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
    ctx.db.yideWorkActivity.findUniqueOrThrow({
      where: { id: input.activityId },
      include: {
        organiser: { select: { id: true, name: true } },
        location: { select: { name: true } },
        staffs: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ),

  updateActivity: activityManageProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        festival: z.string().nullable().optional(),
        locationId: z.number(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        assignments: z.record(z.any()).optional(),
        isDraft: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.yideWorkActivity.update({
        where: {
          id: input.activityId,
        },
        data: {
          title: input.title,
          description: input.description,
          festival: input.festival,
          location: {
            connect: {
              id: input.locationId,
            },
          },
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          assignments: _.isEmpty(input.assignments)
            ? undefined
            : input.assignments,
          status: input.isDraft ? "DRAFT" : undefined,
          version: {
            increment: 1,
          },
        },
      }),
    ),

  deleteActivity: activityManageProcedure.mutation(({ ctx, input }) =>
    ctx.db.yideWorkActivity.delete({
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
      const filters: Prisma.YideWorkActivityWhereInput[] = [];
      // if (input.participatedByMe) {
      //   filters.push({
      //     classActivityCheckRecords: { some: { userId: ctx.session.user.id } },
      //   });
      // }

      const items = await ctx.db.yideWorkActivity.findMany({
        where: filters.length === 0 ? undefined : { OR: filters },
        orderBy: { startDateTime: "desc" },
        include: {
          location: {
            select: {
              name: true,
            },
          },
        },

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

  addStaff: activityManageProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.yideWorkActivityStaff.create({
        data: {
          activityId: input.activityId,
          userId: input.userId,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
    ),

  removeStaff: activityManageProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.yideWorkActivityStaff.delete({
        where: {
          activityId_userId: {
            activityId: input.activityId,
            userId: input.userId,
          },
        },
      });
      return { success: true };
    }),

  participateActivity: activityPublishedOnlyProcedure.mutation(
    async ({ ctx, input }) => {
      return await ctx.db.yideWorkActivityStaff.create({
        data: {
          activityId: input.activityId,
          userId: ctx.session.user.id,
        },
      });
    },
  ),

  leaveActivity: activityPublishedOnlyProcedure.mutation(
    async ({ ctx, input }) => {
      return await ctx.db.yideWorkActivityStaff.delete({
        where: {
          activityId_userId: {
            activityId: input.activityId,
            userId: ctx.session.user.id,
          },
        },
      });
    },
  ),

  getStaffs: activityManageProcedure.query(({ ctx, input }) =>
    ctx.db.yideWorkActivityStaff.findMany({
      where: { activityId: input.activityId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
  ),
});
