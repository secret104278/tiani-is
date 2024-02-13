import { z } from "zod";
import {
  activityPublishedOnlyProcedure,
  representableProcedure,
} from "../../procedures/etogether";
import { createTRPCRouter } from "../../trpc";

export const checkinRouter = createTRPCRouter({
  checkInActivity: activityPublishedOnlyProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        subgroupId: z.number(),
        externals: z.array(
          z.object({ username: z.string().min(1), subgroupId: z.number() }),
        ),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (db) => {
        const mainRegister =
          await db.etogetherActivityRegister.findUniqueOrThrow({
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
      }),
    ),

  getCheckRecord: representableProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.etogetherActivityRegister.findUnique({
        where: {
          userId_activityId: {
            userId: ctx.input.userId,
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
      }),
    ),
});
