import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role, type User } from "@prisma/client";
import { isNil } from "lodash";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import LineProvider from "next-auth/providers/line";

import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { refreshLineImage } from "~/utils/server";
import type { UserRole } from "~/utils/types";

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
export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    signIn: async ({ user, account }) => {
      if (isNil(account)) return false;
      if (isNil(user.id)) return false;

      if (account.provider === "line") {
        const x = await db.account.findUnique({
          select: { id: true },
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        // new user will not have an account
        if (!isNil(x)) {
          await db.account.update({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            data: {
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
            },
          });

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
      checks: ["pkce", "state"],
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
} satisfies NextAuthConfig;
