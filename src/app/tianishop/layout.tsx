import type { Metadata, Viewport } from "next";
import AppLayout from "~/app/components/app-layout";
import { Site, siteToTitle } from "~/utils/ui";

export const viewport: Viewport = {
  themeColor: "#d69c6c",
};

const title = siteToTitle(Site.Volunteer);
const description = `${title}・天一聖道院資訊系統`;
const icon = "/volunteer_logo.png";

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

export default function TianiShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppLayout site={Site.TianiShop}>{children}</AppLayout>;
}
