import { z } from "zod";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
  representableProcedure,
} from "../../procedures/etogether";
import { createTRPCRouter } from "../../trpc";

export const registerRouter = createTRPCRouter({
  registerActivity: activityPublishedOnlyProcedure
    .input(
      z.object({
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
              userId: ctx.session.user.id,
              activityId: input.activityId,
            },
          },
          update: {
            subgroupId: input.subgroupId,
          },
          create: {
            activityId: input.activityId,
            subgroupId: input.subgroupId,
            userId: ctx.session.user.id,
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
      }),
  ),
});
