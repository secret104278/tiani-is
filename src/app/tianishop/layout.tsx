import type { Metadata, Viewport } from "next";
import { type ReactNode } from "react";
import AppLayout from "~/app/components/app-layout";
import { Site, siteToTitle } from "~/utils/ui";
import { CartButton } from "./components/CartButton";

export const viewport: Viewport = {
  themeColor: "#d69c6c",
};

const title = siteToTitle(Site.TianiShop);
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

export default function TianiShopLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout site={Site.TianiShop} headerActions={<CartButton />}>
      {children}
    </AppLayout>
  );
}
