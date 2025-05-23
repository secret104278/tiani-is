import type { PrismaClient } from "@prisma/client";
import { isNil } from "lodash";
import { env } from "~/env.mjs";

const refreshLineToken = async (refreshToken: string) => {
  const res = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.LINE_CLIENT_ID,
      client_secret: env.LINE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  type RefreshTokenResponse = {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
  };

  if (!res.ok) {
    throw new Error(
      `Failed to refresh token: ${res.status} ${
        res.statusText
      } ${await res.text()}`,
    );
  }

  const data = (await res.json()) as RefreshTokenResponse;

  if (data.token_type !== "Bearer") {
    throw new Error("Invalid token type");
  }

  if (!data.scope.includes("profile")) {
    throw new Error("Invalid scope");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
};

export const getLineImageURL = async (db: PrismaClient, userId: string) => {
  await refreshLineTokenIfNeed(db, userId);

  const user = await db.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    select: {
      accounts: {
        select: {
          provider: true,
          access_token: true,
        },
      },
    },
  });

  for (const account of user.accounts) {
    if (account.provider !== "line") {
      continue;
    }

    const res = await fetch("https://api.line.me/v2/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const profile = (await res.json()) as { pictureUrl?: string };

    if (isNil(profile.pictureUrl)) {
      continue;
    }

    return String(profile.pictureUrl);
  }

  return undefined;
};

export const refreshLineImage = async (db: PrismaClient, userId: string) => {
  const imageURL = await getLineImageURL(db, userId);
  if (isNil(imageURL)) return;

  await db.user.update({
    where: { id: userId },
    data: { image: imageURL },
  });
};

export const refreshLineTokenIfNeed = async (
  db: PrismaClient,
  userId: string,
) => {
  const accounts = await db.account.findMany({
    where: {
      userId,
      provider: "line",
    },
    select: {
      id: true,
      access_token: true,
      expires_at: true,
      refresh_token: true,
    },
  });

  for (const account of accounts) {
    if (
      account.refresh_token &&
      account.expires_at &&
      account.expires_at * 1000 < Date.now()
    ) {
      const {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: newExpiresIn,
      } = await refreshLineToken(account.refresh_token);

      await db.account.update({
        where: {
          id: account.id,
        },
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_at: Math.floor(Date.now() / 1000) + newExpiresIn,
        },
      });
    }
  }
};

export const LINE_NOTIFY_CALLBACK_URL = new URL(
  "/api/line/notify/callback",
  `${env.NODE_ENV === "production" ? "https://" : "http://"}${
    env.PUBLIC_DOMAIN
  }`,
).toString();
