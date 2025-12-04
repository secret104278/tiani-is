import { type PrismaClient, type PrismaPromise, Role } from "@prisma/client";
import type { ITXClientDenyList } from "@prisma/client/runtime/library";
import { isNil } from "lodash";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getLineImageURL } from "~/utils/server";
import {
  adminProcedure,
  allAdminProcedure,
  allAdminRepresentableProcedure,
  representableProcedure,
} from "../procedures/tiani";

const handleSetAdmin =
  (userId: string, role: Role, set: boolean) =>
  async (tx: Omit<PrismaClient, ITXClientDenyList>) => {
    const user = await tx.user.findUniqueOrThrow({
      select: { roles: true },
      where: {
        id: userId,
      },
    });

    let newRoles: Role[] = [];
    if (set) {
      newRoles = [...user.roles, role];
      newRoles = Array.from(new Set(newRoles));
    } else newRoles = user.roles.filter((_role) => role !== _role);

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        roles: newRoles,
      },
    });
  };

export const userRouter = createTRPCRouter({
  getLineImage: protectedProcedure.query(({ ctx }) => {
    return getLineImageURL(ctx.db, ctx.session.user.id);
  }),

  getCurrentUserProfile: protectedProcedure.query(({ ctx }) =>
    ctx.db.user.findUnique({
      select: {
        id: true,
        name: true,
        image: true,
        qiudaoDateSolar: true,
        qiudaoHour: true,
        qiudaoTemple: true,
        qiudaoTanzhu: true,
        affiliation: true,
        dianChuanShi: true,
        yinShi: true,
        yinShiGender: true,
        baoShi: true,
        baoShiGender: true,
      },
      where: {
        id: ctx.session.user.id,
      },
    }),
  ),

  updateUserProfile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        image: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          image: input.image,
        },
      });
    }),

  updateQiudaoInfo: protectedProcedure
    .input(
      z.object({
        qiudaoDateSolar: z.date().nullish(),
        qiudaoHour: z.string().nullish(),
        qiudaoTemple: z.string().nullish(),
        qiudaoTanzhu: z.string().nullish(),
        affiliation: z.string().nullish(),
        dianChuanShi: z.string().nullish(),
        yinShi: z.string().nullish(),
        yinShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
        baoShi: z.string().nullish(),
        baoShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          qiudaoDateSolar: input.qiudaoDateSolar,
          qiudaoHour: input.qiudaoHour,
          qiudaoTemple: input.qiudaoTemple,
          qiudaoTanzhu: input.qiudaoTanzhu,
          affiliation: input.affiliation,
          dianChuanShi: input.dianChuanShi,
          yinShi: input.yinShi,
          yinShiGender: input.yinShiGender,
          baoShi: input.baoShi,
          baoShiGender: input.baoShiGender,
        },
      });
    }),

  updateUserQiudaoInfo: allAdminRepresentableProcedure
    .input(
      z.object({
        qiudaoDateSolar: z.date().nullish(),
        qiudaoHour: z.string().nullish(),
        qiudaoTemple: z.string().nullish(),
        qiudaoTanzhu: z.string().nullish(),
        affiliation: z.string().nullish(),
        dianChuanShi: z.string().nullish(),
        yinShi: z.string().nullish(),
        yinShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
        baoShi: z.string().nullish(),
        baoShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: ctx.input.userId,
        },
        data: {
          qiudaoDateSolar: input.qiudaoDateSolar,
          qiudaoHour: input.qiudaoHour,
          qiudaoTemple: input.qiudaoTemple,
          qiudaoTanzhu: input.qiudaoTanzhu,
          affiliation: input.affiliation,
          dianChuanShi: input.dianChuanShi,
          yinShi: input.yinShi,
          yinShiGender: input.yinShiGender,
          baoShi: input.baoShi,
          baoShiGender: input.baoShiGender,
        },
      });
    }),

  createUser: adminProcedure
    .input(
      z.object({
        username: z.string().trim().min(1),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.user.create({
        data: {
          name: input.username,
          roles: [],
        },
      }),
    ),

  getUser: allAdminRepresentableProcedure.query(({ ctx }) =>
    ctx.db.user.findUnique({
      select: {
        id: true,
        name: true,
        roles: true,
        qiudaoDateSolar: true,
        qiudaoHour: true,
        qiudaoTemple: true,
        qiudaoTanzhu: true,
        affiliation: true,
        dianChuanShi: true,
        yinShi: true,
        yinShiGender: true,
        baoShi: true,
        baoShiGender: true,
      },
      where: {
        id: ctx.input.userId,
      },
    }),
  ),

  getUsers: allAdminProcedure.query(async ({ ctx }) =>
    ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        roles: true,
      },
    }),
  ),

  setIsTianiAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const promises: PrismaPromise<unknown>[] = [];

      if (input.isAdmin)
        promises.push(
          ctx.db.activityReviewer.upsert({
            where: { userId: input.userId },
            create: { userId: input.userId },
            update: {},
          }),
        );
      else
        promises.push(
          ctx.db.activityReviewer.deleteMany({
            where: { userId: input.userId },
          }),
        );

      promises.push(
        ctx.db.user.update({
          where: {
            id: input.userId,
          },
          data: {
            roles: input.isAdmin ? [Role.TIANI_ADMIN] : [],
          },
        }),
      );

      await ctx.db.$transaction(promises);
    }),

  setIsVolunteerAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(
        handleSetAdmin(input.userId, Role.VOLUNTEER_ADMIN, input.isAdmin),
      ),
    ),

  setIsYideclassAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(
        handleSetAdmin(input.userId, Role.YIDECLASS_ADMIN, input.isAdmin),
      ),
    ),

  setIsYideworkAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(
        handleSetAdmin(input.userId, Role.YIDEWORK_ADMIN, input.isAdmin),
      ),
    ),

  setIsEtogetherAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(
        handleSetAdmin(input.userId, Role.ETOGETHER_ADMIN, input.isAdmin),
      ),
    ),

  hasLineNotify: representableProcedure.query(async ({ ctx }) => {
    const res = await ctx.db.lineNotify.findUnique({
      where: {
        userId: ctx.input.userId,
      },
    });
    return !isNil(res);
  }),
});

export type UserRouter = typeof userRouter;
