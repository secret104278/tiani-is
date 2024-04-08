import { z } from "zod";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
  representableProcedure,
} from "../../procedures/yidework";
import { createTRPCRouter } from "../../trpc";

export const registerRouter = createTRPCRouter({
  registerActivity: representableProcedure
    .input(
      z.object({
        activityId: z.number(),
        externalRegisters: z.array(z.object({ username: z.string().min(1) })),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (db) => {
        const mainRegister = await db.yideWorkActivityRegister.upsert({
          where: {
            userId_activityId: {
              userId: ctx.input.userId,
              activityId: input.activityId,
            },
          },
          update: {},
          create: {
            activityId: input.activityId,
            userId: ctx.input.userId,
          },
        });

        for (const externalRegister of input.externalRegisters) {
          await db.externalYideWorkActivityRegister.upsert({
            where: {
              activityId_username: {
                activityId: input.activityId,
                username: externalRegister.username,
              },
            },
            update: {},
            create: {
              activityId: input.activityId,
              username: externalRegister.username,
              mainRegisterId: mainRegister.id,
            },
          });
        }

        await db.externalYideWorkActivityRegister.deleteMany({
          where: {
            mainRegisterId: mainRegister.id,
            NOT: {
              username: {
                in: input.externalRegisters.map((e) => e.username),
              },
            },
          },
        });
      }),
    ),

  unregisterActivity: activityPublishedOnlyProcedure.mutation(
    ({ ctx, input }) =>
      ctx.db.yideWorkActivityRegister.delete({
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
      ctx.db.yideWorkActivityRegister.findUnique({
        where: {
          userId_activityId: {
            activityId: input.activityId,
            userId: ctx.input.userId,
          },
        },
        include: {
          externalRegisters: true,
        },
      }),
    ),

  getActivityWithRegistrations: activityManageProcedure.query(
    ({ ctx, input }) =>
      ctx.db.yideWorkActivity.findUniqueOrThrow({
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
              externalRegisters: true,
            },
          },
        },
      }),
  ),

  manualExternalRegister: activityManageProcedure
    .input(
      z.object({
        username: z.string().min(1),
        checked: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.yideWorkActivityRegister.update({
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
              activity: {
                connect: {
                  id: input.activityId,
                },
              },
            },
          },
        },
      });
    }),
});
