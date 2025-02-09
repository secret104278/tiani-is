import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import type { Metadata, Viewport } from "next";
import { type ReactNode } from "react";
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

function CartButton() {
  return (
    <a href="/tianishop/cart" className="btn btn-circle btn-ghost">
      <div className="indicator">
        <ShoppingCartIcon className="h-6 w-6" />
      </div>
    </a>
  );
}

export default function TianiShopLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout site={Site.TianiShop} headerActions={<CartButton />}>
      {children}
    </AppLayout>
  );
}
