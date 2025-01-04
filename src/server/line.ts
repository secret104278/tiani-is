// const globalForLine = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

import * as line from "@line/bot-sdk";
import { env } from "~/env";

const globalForLineBot = globalThis as unknown as {
  lineBot: line.messagingApi.MessagingApiClient | undefined;
};

export const bot =
  globalForLineBot.lineBot ??
  new line.messagingApi.MessagingApiClient({
    channelAccessToken: env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
  });

if (env.NODE_ENV !== "production") globalForLineBot.lineBot = bot;
