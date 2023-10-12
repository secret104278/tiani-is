import { signIn, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export default function AuthGaurd({ children }: { children: ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      void signIn();
    }
  }, [status]);

  if (status === "authenticated") {
    return children;
  }
}
