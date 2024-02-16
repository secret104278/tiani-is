import { isNil, values } from "lodash";
import { z } from "zod";
import { enforceUserIsAuthed, trpcContext as t } from "../trpc";
import { buildAdminProcedure, buildRepresentableProcedure } from "./utils";

export const adminProcedure = buildAdminProcedure("tiani");

export const representableProcedure = buildRepresentableProcedure("tiani");

export const allAdminProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(({ ctx, next }) => {
    if (!values(ctx.session.user.role).some((role) => role === true))
      throw new Error("只有管理員可以進行此操作");

    return next();
  });

export const allAdminRepresentableProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .input(z.object({ userId: z.string().optional() }))
  .use(({ ctx, input, next }) => {
    if (
      !(
        values(ctx.session.user.role).some((role) => role === true) ||
        isNil(input.userId) ||
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
