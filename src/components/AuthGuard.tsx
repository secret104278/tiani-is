import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect } from "react";

export default function AuthGaurd({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (router.pathname.startsWith("/auth")) {
      return;
    }

    if (status === "unauthenticated") {
      void signIn();
    }
  }, [router.pathname, status]);

  if (router.pathname.startsWith("/auth")) {
    return children;
  }

  if (status === "authenticated") {
    return children;
  }
}
