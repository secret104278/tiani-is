import { HomeIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { type ReactNode } from "react";
import { siteHomeHref } from "~/utils/navigation";
import { type Site, siteToTitle } from "~/utils/ui";
import UserMenu from "./user-menu";

export default function AppLayout({
  site,
  children,
  headerActions,
}: {
  site?: Site;
  children: ReactNode;
  headerActions?: ReactNode;
}) {
  return (
    <>
      <div className="navbar mb-4 bg-base-100 shadow-md">
        <div className="navbar-start">
          <Link href={siteHomeHref(site)}>
            <button className="btn btn-circle btn-ghost">
              <HomeIcon className="h-6 w-6" />
            </button>
          </Link>
        </div>
        <div className="navbar-center">
          <Link href={siteHomeHref(site)}>
            <button className="btn btn-ghost text-xl normal-case">
              {siteToTitle(site)}
            </button>
          </Link>
        </div>
        <div className="navbar-end">
          {headerActions}
          <UserMenu />
        </div>
      </div>
      <div className="mx-auto max-w-xl px-4 pb-4">{children}</div>
    </>
  );
}
