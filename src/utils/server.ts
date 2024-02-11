import { type PrismaClient } from "@prisma/client";
import { env } from "~/env.mjs";

export const refreshLineToken = async (refreshToken: string) => {
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
  const user = await db.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    select: {
      accounts: {
        select: {
          id: true,
          provider: true,
          providerAccountId: true,
          access_token: true,
          expires_at: true,
          refresh_token: true,
        },
      },
    },
  });

  for (const account of user.accounts) {
    if (account.provider !== "line") {
      continue;
    }

    let accessToken = account.access_token;

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

      accessToken = newAccessToken;
    }

    const res = await fetch("https://api.line.me/v2/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const profile = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return String(profile.pictureUrl);
  }

  return undefined;
};
