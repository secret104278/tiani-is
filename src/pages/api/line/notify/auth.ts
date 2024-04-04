import * as jose from "jose";
import { isNil } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCsrfToken } from "next-auth/react";
import { env } from "~/env.mjs";
import { getServerAuthSession } from "~/server/auth";
import { LINE_NOTIFY_CALLBACK_URL } from "~/utils/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  const csrf = await getCsrfToken({ req });

  if (isNil(session) || isNil(csrf)) return res.status(401).end();

  const state = jose.base64url.encode(
    JSON.stringify({ redirect: req.query.redirect, csrf }),
  );

  // client_id=VqPtwQbvOWqnw9g8PQgyDN&redirect_uri=http://localhost:3100&scope=notify&state=NO_STATE
  const authorizationUrl = new URL(
    "https://notify-bot.line.me/oauth/authorize",
  );
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", env.LINE_NOTIFY_CLIENT_ID);
  authorizationUrl.searchParams.set("redirect_uri", LINE_NOTIFY_CALLBACK_URL);
  authorizationUrl.searchParams.set("scope", "notify");
  authorizationUrl.searchParams.set("state", state);

  res.redirect(authorizationUrl.toString());
}
