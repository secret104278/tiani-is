import * as line from "@line/bot-sdk";
import type { CallbackRequest } from "@line/bot-sdk/dist/webhook/api";
import { isString } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import { db } from "~/server/db";

type Override<T1, T2> = Omit<T1, keyof T2> & T2;

export default async function handler(
  req: Override<NextApiRequest, { body: CallbackRequest }>,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).end();
  }

  await line.middleware({
    channelSecret: env.LINE_BOT_CHANNEL_SECRET,
    channelAccessToken: env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
  })(req, res, () => void 0);

  const handleJoinLeave = async (event: line.JoinEvent, isJoin: boolean) => {
    switch (event.source?.type) {
      case "group":
        const groupId = event.source.groupId;
        if (isString(groupId))
          if (isJoin)
            await db.activityAdvertisingTarget.upsert({
              where: {
                lineId: groupId,
              },
              update: {
                lineId: groupId,
              },
              create: {
                lineId: groupId,
              },
            });
          else
            await db.activityAdvertisingTarget.delete({
              where: {
                lineId: groupId,
              },
            });
        break;
      case "room":
        const roomId = event.source.roomId;
        if (isString(roomId))
          if (isJoin)
            await db.activityAdvertisingTarget.upsert({
              where: {
                lineId: roomId,
              },
              update: {
                lineId: roomId,
              },
              create: {
                lineId: roomId,
              },
            });
          else
            await db.activityAdvertisingTarget.delete({
              where: {
                lineId: roomId,
              },
            });
    }
  };

  for (const event of req.body.events ?? []) {
    switch (event.type) {
      case "join":
        await handleJoinLeave(event as line.JoinEvent, true);
        break;
      case "leave":
        await handleJoinLeave(event as line.JoinEvent, false);
        break;
    }
  }

  res.json({ result: "ok" });
}
