import { z } from "zod";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
  representableProcedure,
} from "../../procedures/etogether";
import { createTRPCRouter } from "../../trpc";

export const registerRouter = createTRPCRouter({
  registerActivity: representableProcedure
    .input(
      z.object({
        activityId: z.number(),
        subgroupId: z.number(),
        externalRegisters: z.array(
          z.object({ username: z.string().min(1), subgroupId: z.number() }),
        ),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (db) => {
        const mainRegister = await db.etogetherActivityRegister.upsert({
          where: {
            userId_activityId: {
              userId: ctx.input.userId,
              activityId: input.activityId,
            },
          },
          update: {
            subgroupId: input.subgroupId,
          },
          create: {
            activityId: input.activityId,
            subgroupId: input.subgroupId,
            userId: ctx.input.userId,
          },
        });

        // TODO: deal with already checkin
        await db.externalEtogetherActivityRegister.deleteMany({
          where: {
            mainRegisterId: mainRegister.id,
          },
        });

        await db.externalEtogetherActivityRegister.createMany({
          data: input.externalRegisters.map((e) => ({
            activityId: input.activityId,
            subgroupId: e.subgroupId,
            username: e.username,
            mainRegisterId: mainRegister.id,
          })),
        });
      }),
    ),

  unregisterActivity: activityPublishedOnlyProcedure.mutation(
    ({ ctx, input }) =>
      ctx.db.etogetherActivityRegister.delete({
        where: {
          userId_activityId: {
            userId: ctx.session.user.id,
            activityId: input.activityId,
          },
        },
      }),
  ),

  getRegister: representableProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.etogetherActivityRegister.findUnique({
        where: {
          userId_activityId: {
            activityId: input.activityId,
            userId: ctx.input.userId,
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
      }),
    ),

  getActivityWithRegistrations: activityManageProcedure.query(
    ({ ctx, input }) =>
      ctx.db.etogetherActivity.findUniqueOrThrow({
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
              subgroup: true,
              checkRecord: true,
              externalRegisters: {
                include: {
                  subgroup: true,
                  checkRecord: true,
                },
              },
            },
          },
          subgroups: true,
        },
      }),
  ),

  manualExternalRegister: activityManageProcedure
    .input(
      z.object({
        username: z.string().min(1),
        subgroupId: z.number(),
        checked: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.etogetherActivityRegister.update({
        where: {
          userId_activityId: {
            userId: ctx.session.user.id,
            activityId: input.activityId,
          },
        },
        data: {
          externalRegisters: {
            create: {
              username: input.username,
              subgroup: {
                connect: {
                  id: input.subgroupId,
                },
              },
              activity: {
                connect: {
                  id: input.activityId,
                },
              },
              checkRecord: input.checked
                ? {
                    create: {},
                  }
                : undefined,
            },
          },
        },
      });
    }),
});
