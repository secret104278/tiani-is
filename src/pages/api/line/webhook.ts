import * as line from "@line/bot-sdk";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).end();
  }

  await line.middleware({
    channelSecret: env.LINE_BOT_CHANNEL_SECRET,
    channelAccessToken: env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
  })(req, res, () => void 0);

  console.log(JSON.stringify(req.body));

  res.json({ result: "ok" });
}
