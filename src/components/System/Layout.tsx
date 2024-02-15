import { BellAlertIcon, HomeIcon } from "@heroicons/react/20/solid";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type ReactNode } from "react";
import { useSiteContext } from "~/context/SiteContext";
import { api } from "~/utils/api";
import { siteToTitle } from "~/utils/ui";
import LineNotifySetupTutorialDialog from "../LineNotifySetupTutorialDialog";
import LineImage from "../utils/LineImage";

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
      <div className="bg-neutral-focus w-10 rounded-full text-neutral-content">
        <span>{sessionData.user.name}</span>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { data: sessionData } = useSession();
  const { site } = useSiteContext();
  const router = useRouter();

  const { data: hasLineNotify } = api.user.hasLineNotify.useQuery({});
  const [showLineNotifySetup, setShowLineNotifySetup] = useState(false);

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
              {router.pathname.startsWith("/auth")
                ? "天一聖道院資訊系統"
                : siteToTitle(site)}
            </button>
          </Link>
        </div>
        <div className="navbar-end">
          {sessionData && (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
                <UserAvatar />
              </label>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow-xl outline outline-1 outline-base-200"
              >
                <li className="disabled">
                  <a>{sessionData.user.name}</a>
                </li>
                {sessionData.user.role.is_tiani_admin && (
                  <li>
                    <Link href="/admin/users">帳號管理</Link>
                  </li>
                )}
                {sessionData.user.role.is_volunteer_admin && (
                  <li>
                    <Link href="/volunteer/admin/working">工作管理</Link>
                  </li>
                )}
                {sessionData.user.role.is_yideclass_admin && (
                  <li>
                    <Link href="/yideclass/admin/class">班務管理</Link>
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

      {hasLineNotify === false && (
        <>
          <LineNotifySetupTutorialDialog
            show={showLineNotifySetup}
            closeModal={() => null}
            onConfirm={() =>
              void router.push(
                `/api/line/notify/auth?redirect=${router.asPath}`,
              )
            }
          ></LineNotifySetupTutorialDialog>
          <button
            className="btn fixed bottom-8 right-8 rounded-full border-none bg-[#00C300] text-[#fff] drop-shadow-2xl hover:bg-[#00C300]"
            onClick={() => setShowLineNotifySetup(true)}
          >
            <BellAlertIcon className="h-5 w-5 animate-bounce" />
            設定 Line 通知
          </button>
        </>
      )}

      {/* <div className="container mx-auto w-full px-4"></div> */}
    </>
  );
}
