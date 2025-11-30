import { Prisma } from "@prisma/client";
import { isNumber, omit } from "lodash";
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
            displayColorCode: z.string().length(7).nullable(),
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
            id: z.number().nullable(),
            title: z.string(),
            description: z.string().nullable(),
            displayColorCode: z.string().length(7).nullable(),
          }),
        ),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (db) => {
        try {
          await db.etogetherActivitySubgroup.deleteMany({
            where: {
              etogetherActivityId: input.activityId,
              NOT: {
                id: {
                  in: input.subgroups
                    .map((subgroup) => subgroup.id)
                    .filter(isNumber),
                },
              },
            },
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2003" // Foreign key constraint failed
          ) {
            throw new Error("不能刪除已經有人報名的組別");
          }
          throw error;
        }

        await db.etogetherActivitySubgroup.createMany({
          data: input.subgroups
            .filter((subgroup) => !isNumber(subgroup.id))
            .map((subgroup) => ({
              ...omit(subgroup, "id"),
              etogetherActivityId: input.activityId,
            })),
        });

        await Promise.all(
          input.subgroups
            .filter((subgroup) => isNumber(subgroup.id))
            .map((subgroup) =>
              db.etogetherActivitySubgroup.update({
                where: { id: subgroup.id! },
                data: omit(subgroup, "id"),
              }),
            ),
        );

        return await db.etogetherActivity.update({
          where: {
            id: input.activityId,
          },
          data: {
            title: input.title,
            description: input.description,
            location: input.location,
            startDateTime: input.startDateTime,
            endDateTime: input.endDateTime,
            status: input.isDraft ? "DRAFT" : "PUBLISHED",
            version: {
              increment: 1,
            },
          },
        });
      }),
    ),

  deleteActivity: activityManageProcedure.mutation(async ({ ctx, input }) => {
    const hasRegistrations = await ctx.db.etogetherActivityRegister.count({
      where: { activityId: input.activityId },
    });
    if (hasRegistrations > 0) {
      throw new Error("無法撤銷已有人報名的活動");
    }

    return ctx.db.$transaction(async (db) => {
      await db.etogetherActivitySubgroup.deleteMany({
        where: { etogetherActivityId: input.activityId },
      });
      return db.etogetherActivity.delete({
        where: { id: input.activityId },
      });
    });
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
