import { Role, type PrismaClient, type PrismaPromise } from "@prisma/client";
import { isEmpty, isNil } from "lodash";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getLineImageURL } from "~/utils/server";
import { trimString } from "~/utils/ui";

const handleSetAdmin =
  (userId: string, role: Role, set: boolean) => async (tx: PrismaClient) => {
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
  getLineImage: protectedProcedure.input(z.object({})).query(({ ctx }) => {
    return getLineImageURL(ctx.db, ctx.session.user.id);
  }),

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

  createUser: protectedProcedure
    .input(
      z.object({
        username: z.preprocess(trimString, z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("只有管理員可以新增帳戶");

      if (isEmpty(input.username)) throw new Error("姓名不可為空");

      return await ctx.db.user.create({
        data: {
          name: input.username,
          roles: [],
        },
      });
    }),

  getUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_volunteer_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以查看其他人的資料");

      return await ctx.db.user.findUnique({
        select: {
          id: true,
          name: true,
          roles: true,
        },
        where: {
          id: input.userId ?? ctx.session.user.id,
        },
      });
    }),

  getUsers: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        roles: true,
      },
    });
  }),

  getUsersWithImage: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
          roles: true,
        },
      });
    }),

  getActivityReviewers: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.db.activityReviewer.findMany({
        select: {
          userId: true,
        },
      });
    }),

  setIsTianiAdmin: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("Permission denied");

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

  setIsVolunteerAdmin: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("Permission denied");

      await ctx.db.$transaction(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        handleSetAdmin(input.userId, Role.VOLUNTEER_ADMIN, input.isAdmin),
      );
    }),

  setIsYideclassAdmin: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("Permission denied");

      await ctx.db.$transaction(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        handleSetAdmin(input.userId, Role.YIDECLASS_ADMIN, input.isAdmin),
      );
    }),
});
