import "leaflet/dist/leaflet.css";
import "~/styles/globals.css";

import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import AutoSignInRedirect from "~/app/components/auto-signin-redirect";
import { auth } from "~/server/auth";
import { TRPCReactProvider } from "~/trpc/react";
import { HydrateClient } from "~/trpc/server";

const title = "天一聖道院資訊系統";
const description = "天一聖道院資訊系統";
const icon = "/logo512.png";

export const metadata: Metadata = {
  title,
  description,
  icons: [{ rel: "icon", url: icon }],
  openGraph: {
    title,
    description,
    images: [{ url: icon }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="zh-TW">
      <body>
        <SessionProvider session={session}>
          <AutoSignInRedirect />
          <TRPCReactProvider>
            <HydrateClient>{children}</HydrateClient>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
