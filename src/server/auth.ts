import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role, type User } from "@prisma/client";
import { and, eq } from "drizzle-orm";
import { isNil } from "lodash";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import LineProvider from "next-auth/providers/line";
import { env } from "~/env.mjs";
import { db, drizzleDB } from "~/server/db";
import { refreshLineImage } from "~/utils/server";
import type { UserRole } from "~/utils/types";
import { accountPgTable } from "./db/schema";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      // ...other properties
      role: UserRole;
    };
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    signIn: async ({ user, account }) => {
      if (isNil(account)) return false;

      if (account.provider === "line") {
        const accountInDB = await drizzleDB
          .select({
            id: accountPgTable.id,
          })
          .from(accountPgTable)
          .where(
            and(
              eq(accountPgTable.provider, account.provider),
              eq(accountPgTable.providerAccountId, account.providerAccountId),
            ),
          )
          .limit(1)
          .then((res) => res.at(0));

        // new user will not have an account
        if (!isNil(accountInDB)) {
          await drizzleDB
            .update(accountPgTable)
            .set({
              refreshToken: account.refresh_token,
              accessToken: account.access_token,
              expiresAt: account.expires_at,
            })
            .where(eq(accountPgTable.id, accountInDB.id));

          void refreshLineImage(db, user.id);
        }
      }

      return true;
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: {
          is_tiani_admin: (user as User).roles.includes(Role.TIANI_ADMIN),
          is_volunteer_admin:
            (user as User).roles.includes(Role.VOLUNTEER_ADMIN) ||
            (user as User).roles.includes(Role.TIANI_ADMIN),
          is_yideclass_admin:
            (user as User).roles.includes(Role.YIDECLASS_ADMIN) ||
            (user as User).roles.includes(Role.TIANI_ADMIN),
          is_yidework_admin:
            (user as User).roles.includes(Role.YIDEWORK_ADMIN) ||
            (user as User).roles.includes(Role.TIANI_ADMIN),
          is_etogether_admin:
            (user as User).roles.includes(Role.ETOGETHER_ADMIN) ||
            (user as User).roles.includes(Role.TIANI_ADMIN),
        },
      },
    }),
  },
  adapter: PrismaAdapter(db),
  providers: [
    LineProvider({
      clientId: env.LINE_CLIENT_ID,
      clientSecret: env.LINE_CLIENT_SECRET,
      authorization: {
        params: {
          bot_prompt: "aggressive", // Add friend to be able to send messages
        },
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
