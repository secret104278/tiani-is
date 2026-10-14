import { type NextRequest, NextResponse } from "next/server";
import {
  buildRegistrationExport,
  verifyRegistrationExportToken,
} from "~/server/etogether/registrationExport";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return new NextResponse("缺少下載連結參數", { status: 400 });

  let activityId: number;
  try {
    activityId = await verifyRegistrationExportToken(token);
  } catch {
    return new NextResponse("下載連結已失效，請回到報名名單重新匯出", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { filename, content } = await buildRegistrationExport(activityId);

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
