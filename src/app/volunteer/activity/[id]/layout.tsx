import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { formatDateTitle } from "~/utils/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const res = await db.volunteerActivity.findUnique({
    select: {
      title: true,
      startDateTime: true,
    },
    where: { id: Number((await params).id) },
  });

  if (!res) {
    notFound();
  }

  const title = `${res.title}・${formatDateTitle(res.startDateTime)}・天一志工隊`;
  const description = "有新的志工工作需要協助，快來報名吧！";
  const icon = "/favicon.ico"; // adjust this path as needed

  return {
    title,
    description,
    icons: [{ rel: "icon", url: icon }],
    openGraph: {
      title,
      description,
      images: [{ url: icon }],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
