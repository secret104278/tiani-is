import { type Prisma } from "@prisma/client";
import { isNil } from "lodash";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const etogetherActivityRouter = createTRPCRouter({
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

  createActivity: protectedProcedure
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
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.etogetherActivity.create({
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
        subgroups: z.array(
          z.object({
            title: z.string(),
            description: z.string().nullable(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgActivity = await ctx.db.etogetherActivity.findUniqueOrThrow({
        select: { status: true, organiserId: true },
        where: {
          id: input.id,
        },
      });

      const isManager =
        ctx.session.user.id === orgActivity.organiserId ||
        ctx.session.user.role.is_etogether_admin;
      if (!isManager) throw new Error("只有管理員可以修改活動");

      const res = await ctx.db.etogetherActivity.update({
        where: {
          id: input.id,
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
      });

      return res;
    }),

  getActivity: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const res = await ctx.db.etogetherActivity.findUnique({
        where: { id: input.id },
        include: {
          organiser: true,
          subgroups: true,
        },
      });

      const isManager =
        res &&
        (ctx.session.user.id === res.organiserId ||
          ctx.session.user.role.is_etogether_admin);

      if (res?.status !== "PUBLISHED" && !isManager) return { activity: null };

      return { activity: res };
    }),

  deleteActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const orgActivity = await ctx.db.etogetherActivity.findUniqueOrThrow({
        select: { status: true, organiserId: true },
        where: {
          id: input.id,
        },
      });

      const isManager =
        ctx.session.user.id === orgActivity.organiserId ||
        ctx.session.user.role.is_etogether_admin;
      if (!isManager) throw new Error("只有管理員可以刪除活動");

      return await ctx.db.classActivity.delete({
        where: { id: input.id },
      });
    }),

  registerActivity: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        subgroupId: z.number(),
        externalRegisters: z.array(
          z.object({ username: z.string().min(1), subgroupId: z.number() }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (db) => {
        const mainRegister = await db.etogetherActivityRegister.upsert({
          where: {
            userId_activityId: {
              userId: ctx.session.user.id,
              activityId: input.id,
            },
          },
          update: {
            subgroupId: input.subgroupId,
          },
          create: {
            activityId: input.id,
            subgroupId: input.subgroupId,
            userId: ctx.session.user.id,
          },
        });

        // FIXME: deal with already checkin
        await db.externalEtogetherActivityRegister.deleteMany({
          where: {
            mainRegisterId: mainRegister.id,
          },
        });

        await db.externalEtogetherActivityRegister.createMany({
          data: input.externalRegisters.map((e) => ({
            activityId: input.id,
            subgroupId: e.subgroupId,
            username: e.username,
            mainRegisterId: mainRegister.id,
          })),
        });
      });
    }),

  getRegister: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id &&
        !ctx.session.user.role.is_etogether_admin
      ) {
        throw new Error("只有管理員可以查看別人的報名");
      }

      return await ctx.db.etogetherActivityRegister.findUnique({
        where: {
          userId_activityId: {
            activityId: input.activityId,
            userId: input.userId ?? ctx.session.user.id,
          },
        },
        include: {
          subgroup: true,
          externalRegisters: {
            include: {
              subgroup: true,
            },
          },
        },
      });
    }),

  checkInActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        subgroupId: z.number(),
        externals: z.array(
          z.object({ username: z.string().min(1), subgroupId: z.number() }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (db) => {
        const mainRegister = await db.etogetherActivityRegister.findUnique({
          where: {
            userId_activityId: {
              userId: ctx.session.user.id,
              activityId: input.activityId,
            },
          },
          include: {
            externalRegisters: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!mainRegister) {
          throw new Error("尚未報名");
        }

        await db.etogetherActivityCheckRecord.create({
          data: {
            registerId: mainRegister.id,

            latitude: input.latitude,
            longitude: input.longitude,
          },
        });

        await db.externalEtogetherActivityCheckRecord.createMany({
          data: mainRegister.externalRegisters.map((e) => ({
            registerId: e.id,
          })),
        });
      });
    }),

  getCheckRecord: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.etogetherActivityRegister.findUnique({
        where: {
          userId_activityId: {
            userId: input.userId ?? ctx.session.user.id,
            activityId: input.activityId,
          },
        },
        select: {
          checkRecord: true,
          externalRegisters: {
            select: {
              checkRecord: true,
            },
          },
        },
      });
    }),

  getActivityWithRegistrations: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.etogetherActivity.findUniqueOrThrow({
        select: { organiserId: true },
        where: { id: input.activityId },
      });

      if (
        !(
          ctx.session.user.id === activity.organiserId ||
          ctx.session.user.role.is_etogether_admin
        )
      ) {
        throw new Error("只有管理員可以查看報名");
      }

      return await ctx.db.etogetherActivity.findUniqueOrThrow({
        where: { id: input.activityId },
        include: {
          registers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              checkRecord: true,
            },
          },
          externalRegisters: {
            include: {
              checkRecord: true,
            },
          },
          subgroups: true,
        },
      });
    }),
});
