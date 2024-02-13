import { z } from "zod";
import { enforceUserIsAuthed, trpcContext as t } from "../trpc";

export const activityManageProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .input(z.object({ activityId: z.number() }))
  .use(async ({ ctx, input, next }) => {
    const activity = await ctx.db.classActivity.findUniqueOrThrow({
      select: { organiserId: true },
      where: {
        id: input.activityId,
      },
    });

    const isManager =
      ctx.session.user.id === activity.organiserId ||
      ctx.session.user.role.is_yideclass_admin;
    if (!isManager) throw new Error("只有管理員可以進行此操作");

    return next();
  });

export const activityRepresentableProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .input(z.object({ activityId: z.number(), userId: z.string().optional() }))
  .use(async ({ ctx, input, next }) => {
    const activity = await ctx.db.classActivity.findUniqueOrThrow({
      select: { organiserId: true },
      where: {
        id: input.activityId,
      },
    });

    const isManager =
      ctx.session.user.id === activity.organiserId ||
      ctx.session.user.role.is_yideclass_admin;
    if (!(isManager || input.userId === ctx.session.user.id))
      throw new Error("只有管理員或本人可以進行此操作");

    return next({
      ctx: {
        input: {
          userId: input.userId ?? ctx.session.user.id,
        },
      },
    });
  });

export const activityPublishedOnlyProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .input(z.object({ activityId: z.number() }))
  .use(async ({ ctx, input, next }) => {
    const activity = await ctx.db.classActivity.findUniqueOrThrow({
      select: { status: true, organiserId: true },
      where: {
        id: input.activityId,
      },
    });

    const isManager =
      ctx.session.user.id === activity.organiserId ||
      ctx.session.user.role.is_yideclass_admin;

    if (!(isManager || activity.status === "PUBLISHED"))
      throw new Error("只有管理員可以進行此操作");

    return next();
  });

export const adminProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(({ ctx, next }) => {
    if (!ctx.session.user.role.is_yideclass_admin)
      throw new Error("只有管理員可以進行此操作");

    return next();
  });

export const representableProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .input(z.object({ userId: z.string().optional() }))
  .use(({ ctx, input, next }) => {
    if (
      !(
        ctx.session.user.role.is_yideclass_admin ||
        input.userId === ctx.session.user.id
      )
    )
      throw new Error("只有管理員或本人可以進行此操作");

    return next({
      ctx: {
        input: {
          userId: input.userId ?? ctx.session.user.id,
        },
      },
    });
  });
