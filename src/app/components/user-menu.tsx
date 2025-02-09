import { type Session } from "next-auth";
import Link from "next/link";
import { auth, signOut } from "~/server/auth";
import {
  adminUsersHref,
  personalAccountHref,
  volunteerAdminWorkingHref,
  yideclassAdminClassHref,
} from "~/utils/navigation";
import LineImage from "./line-image";

function UserAvatar({ sessionData }: { sessionData: Session }) {
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

export default async function UserMenu() {
  const sessionData = await auth();

  if (!sessionData) {
    return (
      <Link href="/api/auth/signin" className="btn btn-ghost btn-sm">
        登入
      </Link>
    );
  }

  return (
    <div className="dropdown dropdown-end z-50">
      <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
        <UserAvatar sessionData={sessionData} />
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
            <Link href={adminUsersHref()}>帳號管理</Link>
          </li>
        )}
        {sessionData.user.role.is_volunteer_admin && (
          <li>
            <Link href={volunteerAdminWorkingHref()}>工作管理</Link>
          </li>
        )}
        {sessionData.user.role.is_yideclass_admin && (
          <li>
            <Link href={yideclassAdminClassHref()}>班務管理</Link>
          </li>
        )}
        <li>
          <Link href={personalAccountHref()}>個人資料</Link>
        </li>
        <li>
          <Link href="/tianishop/my/orders">我的訂單</Link>
        </li>
        <li>
          <Link href="/tianishop/my/listings">我的商品</Link>
        </li>
        <li>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit">登出</button>
          </form>
        </li>
      </ul>
    </div>
  );
}
