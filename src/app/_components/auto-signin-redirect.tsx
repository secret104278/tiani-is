"use client";

import { signIn, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const publicPaths = ["/signin"];

export function useAutoSignInRedirect() {
  const auth = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (publicPaths.some((path) => pathname?.startsWith(path))) {
      return;
    }

    if (auth.status === "unauthenticated") {
      void signIn();
    }
  }, [pathname, auth.status]);
}

export default function AutoSignInRedirect() {
  useAutoSignInRedirect();
  return null;
}
