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
