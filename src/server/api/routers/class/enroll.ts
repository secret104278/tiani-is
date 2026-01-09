import { z } from "zod";
import {
  adminProcedure,
  representableProcedure,
} from "../../procedures/class";
import { createTRPCRouter } from "../../trpc";

export const enrollRouter = createTRPCRouter({
  enrollClass: representableProcedure
    .input(
      z.object({
        classTitle: z.string(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.classMemberEnrollment.upsert({
        where: {
          userId_classTitle: {
            userId: ctx.input.userId,
            classTitle: input.classTitle,
          },
        },
        update: {},
        create: {
          user: {
            connect: {
              id: ctx.input.userId,
            },
          },
          classTitle: input.classTitle,
        },
      }),
    ),

  unenrollClass: representableProcedure
    .input(
      z.object({
        classTitle: z.string(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.classMemberEnrollment.deleteMany({
        where: {
          userId: ctx.input.userId,
          classTitle: input.classTitle,
        },
      }),
    ),

  getClassMemberEnrollments: adminProcedure
    .input(
      z.object({
        classTitle: z.string(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.classMemberEnrollment.findMany({
        where: {
          classTitle: input.classTitle,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ),
});
