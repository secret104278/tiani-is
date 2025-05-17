import * as Sentry from "@sentry/browser";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect } from "react";

export default function SentrySetup({ children }: { children: ReactNode }) {
  const { data: sessionData } = useSession();

  useEffect(() => {
    if (sessionData?.user.name)
      Sentry.setUser({ username: sessionData?.user.name });
    else Sentry.setUser(null);
  }, [sessionData?.user.name]);

  return children;
}
