import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import type { ReactNode } from "react";

function UserAvatar() {
  const { data: sessionData } = useSession();

  if (!sessionData) {
    return <span className="loading loading-ring loading-md"></span>;
  }

  if (sessionData.user.image) {
    return (
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={sessionData.user.image} />
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

  if (!sessionData) {
    return <span className="loading loading-ring loading-md"></span>;
  }

  return (
    <>
      <div className="navbar bg-base-100">
        <div className="navbar-start" />
        <div className="navbar-center">
          <Link href="/">
            <button className="btn btn-ghost text-xl normal-case">
              天一志工隊
            </button>
          </Link>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
              <UserAvatar />
            </label>
            <ul
              tabIndex={0}
              className="menu dropdown-content rounded-box z-[1] mt-3 w-52 bg-base-100 p-2 shadow-xl outline outline-1 outline-base-200"
            >
              <li>
                <a onClick={() => void signOut()}>登出</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-xl px-4 pb-16">{children}</div>
      {/* <div className="container mx-auto w-full px-4"></div> */}
    </>
  );
}
