import { isNil, map } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { getLineImageURL } from "~/utils/server";

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
      const imageURL = await getLineImageURL(db, user.id);
      if (isNil(imageURL)) return;
      if (imageURL === user.image) return;

      console.info(`Updating ${user.name}'s image`);

      await db.user.update({
        where: { id: user.id },
        data: { image: imageURL },
      });
    }),
  );

  res.json({ result: "ok" });
}
