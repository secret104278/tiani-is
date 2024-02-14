import { isNil } from "lodash";
import { db } from "./db";

export const pushNotification = async (userId: string, message: string) => {
  const lineNotify = await db.lineNotify.findUnique({
    where: { userId },
  });
  if (isNil(lineNotify)) return;

  await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lineNotify.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ message }),
  });
};
