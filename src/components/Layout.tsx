import { HomeIcon } from "@heroicons/react/20/solid";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSiteContext } from "~/context/SiteContext";
import LineImage from "./LineImage";

function UserAvatar() {
  const { data: sessionData } = useSession();

  if (!sessionData) {
    return <span className="loading loading-ring loading-md"></span>;
  }

  if (sessionData.user.image) {
    return (
      <div className="avatar">
        <div className="w-10 rounded-full">
          <LineImage
            src={sessionData.user.image}
            alt={sessionData.user.name ?? "user image"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="avatar placeholder">
      <div className="w-10 rounded-full bg-neutral-focus text-neutral-content">
        <span>{sessionData.user.name}</span>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { data: sessionData } = useSession();
  const { site } = useSiteContext();

  return (
    <>
      <div className="navbar mb-4 bg-base-100 shadow-md">
        <div className="navbar-start">
          <Link href={`/${site}`}>
            <button className="btn btn-circle btn-ghost">
              <HomeIcon className="h-6 w-6" />
            </button>
          </Link>
        </div>
        <div className="navbar-center">
          <Link href={`/${site}`}>
            <button className="btn btn-ghost text-xl normal-case">
              {site === "volunteer" ? "天一志工隊" : "義德班務網"}
            </button>
          </Link>
        </div>
        <div className="navbar-end">
          {sessionData && (
            <div className="dropdown-end dropdown">
              <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
                <UserAvatar />
              </label>
              <ul
                tabIndex={0}
                className="menu dropdown-content rounded-box z-[1] mt-3 w-52 bg-base-100 p-2 shadow-xl outline outline-1 outline-base-200"
              >
                <li className="disabled">
                  <a>{sessionData.user.name}</a>
                </li>
                {sessionData.user.role === "ADMIN" && (
                  <li>
                    <Link href="/volunteer/admin/users">帳號管理</Link>
                  </li>
                )}
                <li>
                  <Link href="/personal/account">個人資料</Link>
                </li>
                <li>
                  <a onClick={() => void signOut()}>登出</a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-xl px-4 pb-16">{children}</div>
      {/* <div className="container mx-auto w-full px-4"></div> */}
    </>
  );
}
