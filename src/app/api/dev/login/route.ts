import { randomUUID } from "node:crypto";
import { addDays } from "date-fns";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  if (!userId) {
    return new NextResponse("Missing userId", { status: 400 });
  }

  // 1. Verify user exists
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // 清理該使用者的舊 Session 以避免本地開發環境資料庫堆積
  await db.session.deleteMany({
    where: { userId: user.id },
  });

  // 2. Create a session token manually
  const sessionToken = randomUUID();
  const expires = addDays(new Date(), 30);

  // 3. Insert session into Database
  await db.session.create({
    data: {
      userId: user.id,
      sessionToken,
      expires,
    },
  });

  // 4. Set the cookie
  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    expires,
    secure: (process.env.NODE_ENV as string) === "production",
  };

  cookieStore.set("authjs.session-token", sessionToken, cookieOptions);
  cookieStore.set("next-auth.session-token", sessionToken, cookieOptions);

  // 5. Redirect user
  return NextResponse.redirect(new URL(callbackUrl, req.url));
}
