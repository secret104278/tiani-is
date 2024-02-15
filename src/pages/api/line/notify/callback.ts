import * as jose from "jose";
import { get, isNil, isString } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCsrfToken } from "next-auth/react";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { LINE_NOTIFY_CALLBACK_URL } from "~/utils/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  const csrf = await getCsrfToken({ req });

  if (isNil(session) || isNil(csrf)) {
    res.status(401).end();
    return;
  }

  const { code, state } = req.query;
  if (isNil(code) || isNil(state) || !isString(state)) {
    res.status(400).end();
    return;
  }
  const decoder = new TextDecoder();
  const { redirect, csrf: csrfFromState } = JSON.parse(
    decoder.decode(jose.base64url.decode(state)),
  ) as { redirect?: string; csrf: string };

  if (csrfFromState !== csrf) {
    res.status(403).end();
    return;
  }
  if (!isString(code)) {
    res.status(400).end();
    return;
  }

  const oauthRes = await fetch("https://notify-bot.line.me/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: LINE_NOTIFY_CALLBACK_URL,
      client_id: process.env.LINE_NOTIFY_CLIENT_ID,
      client_secret: process.env.LINE_NOTIFY_CLIENT_SECRET,
    } as Record<string, string>),
  });

  if (!oauthRes.ok) {
    console.error(await oauthRes.text());
    res.status(500).end();
    return;
  }

  const accessToken = get(await oauthRes.json(), "access_token") as
    | string
    | undefined;
  if (!isString(accessToken)) {
    res.status(500).end();
    return;
  }

  await db.lineNotify.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      accessToken,
    },
    update: {
      accessToken,
    },
  });

  if (isNil(redirect)) {
    res.redirect("/personal/account");
    return;
  }

  res.redirect(redirect);
}
