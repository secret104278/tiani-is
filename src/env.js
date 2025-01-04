import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_PRISMA_URL: z.string().url(),
    DATABASE_URL_NON_POOLING: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    LINE_BOT_CHANNEL_SECRET: z.string(),
    LINE_BOT_CHANNEL_ACCESS_TOKEN: z.string(),

    LINE_CLIENT_ID: z.string(),
    LINE_CLIENT_SECRET: z.string(),

    LINE_NOTIFY_CLIENT_ID: z.string(),
    LINE_NOTIFY_CLIENT_SECRET: z.string(),

    CRON_SECRET: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_PRISMA_URL: process.env.DATABASE_PRISMA_URL,
    DATABASE_URL_NON_POOLING: process.env.DATABASE_URL_NON_POOLING,
    NODE_ENV: process.env.NODE_ENV,

    LINE_BOT_CHANNEL_SECRET: process.env.LINE_BOT_CHANNEL_SECRET,
    LINE_BOT_CHANNEL_ACCESS_TOKEN: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN,

    LINE_CLIENT_ID: process.env.LINE_CLIENT_ID,
    LINE_CLIENT_SECRET: process.env.LINE_CLIENT_SECRET,

    CRON_SECRET: process.env.CRON_SECRET,

    LINE_NOTIFY_CLIENT_ID: process.env.LINE_NOTIFY_CLIENT_ID,
    LINE_NOTIFY_CLIENT_SECRET: process.env.LINE_NOTIFY_CLIENT_SECRET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
