import { type Prisma } from "@prisma/client";
import { z } from "zod";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
  adminProcedure,
} from "../../procedures/etogether";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const activityRouter = createTRPCRouter({
  createActivity: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        location: z.string(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        isDraft: z.boolean().optional(),
        subgroups: z.array(
          z.object({
            title: z.string(),
            description: z.string().nullable(),
          }),
        ),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.etogetherActivity.create({
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          subgroups: { create: input.subgroups },
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
    ctx.db.etogetherActivity.findUnique({
      where: { id: input.activityId },
      include: {
        organiser: {
          select: { name: true },
        },
        subgroups: true,
      },
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
        subgroups: z.array(
          z.object({
            title: z.string(),
            description: z.string().nullable(),
          }),
        ),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.etogetherActivity.update({
        where: {
          id: input.activityId,
        },
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          subgroups: { create: input.subgroups },
          status: input.isDraft ? "DRAFT" : "PUBLISHED",
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

  getAllActivitiesInfinite: protectedProcedure
    .input(
      z.object({
        participatedByMe: z.boolean().optional(),

        limit: z.number().min(1).max(100).default(10),
        cursor: z.object({ startDateTime: z.date(), id: z.number() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters: Prisma.EtogetherActivityWhereInput[] = [];
      if (input.participatedByMe) {
        filters.push({
          registers: { some: { userId: ctx.session.user.id } },
        });
      }

      const items = await ctx.db.etogetherActivity.findMany({
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
});
