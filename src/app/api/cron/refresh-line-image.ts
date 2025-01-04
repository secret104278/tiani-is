import { map } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";
import { db } from "~/server/db";
import { refreshLineImage } from "~/utils/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.headers.authorization !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).end("Unauthorized");
  }

  const users = await db.user.findMany({
    select: { id: true, image: true, name: true },
  });
  await Promise.all(
    map(users, async (user) => {
      try {
        console.info(`Updating ${user.name}'s image`);
        await refreshLineImage(db, user.id);
      } catch (e) {
        console.error(e);
      }
    }),
  );

  res.json({ result: "ok" });
}
