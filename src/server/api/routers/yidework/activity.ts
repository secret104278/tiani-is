import { type Prisma } from "@prisma/client";
import { z } from "zod";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
} from "../../procedures/yidework";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const activityRouter = createTRPCRouter({
  createActivity: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        locationId: z.number(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        isDraft: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.yideWorkActivity.create({
        data: {
          title: input.title,
          description: input.description,
          location: {
            connect: {
              id: input.locationId,
            },
          },
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
    ctx.db.yideWorkActivity.findUniqueOrThrow({
      where: { id: input.activityId },
      include: {
        organiser: { select: { name: true } },
        location: { select: { name: true } },
      },
    }),
  ),

  updateActivity: activityManageProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        locationId: z.number(),
        startDateTime: z.date(),
        endDateTime: z.date(),
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
          location: {
            connect: {
              id: input.locationId,
            },
          },
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
});
