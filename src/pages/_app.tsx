import { Analytics } from "@vercel/analytics/react";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import Head from "next/head";
import AuthGaurd from "~/components/AuthGuard";
import Layout from "~/components/Layout";

import "leaflet/dist/leaflet.css";
import { useRouter } from "next/router";
import SentrySetup from "~/components/SentrySetup";
import { SiteProvider } from "~/context/SiteContext";
import "~/styles/globals.css";
import type { OGMetaProps } from "~/utils/types";

const MyApp: AppType<{ session: Session | null; ogMeta?: OGMetaProps }> = ({
  Component,
  pageProps: { session, ogMeta, ...pageProps },
}) => {
  const router = useRouter();
  const isYideclass = router.pathname.split("/")[1] === "yideclass";
  const isVolunteer = router.pathname.split("/")[1] === "volunteer";

  let siteIcon = "/logo512.png";
  if (isYideclass) siteIcon = "/yideclass_logo.png";
  else if (isVolunteer) siteIcon = "/volunteer_logo.png";

  let themeColor = "";
  if (isYideclass) themeColor = "#d1c0d8";
  else if (isVolunteer) themeColor = "#d69c6c";

  return (
    <>
      <Head>
        <title>{ogMeta?.ogTitle ?? "天一聖道院資訊系統"}</title>
        <meta name="description" content="天一聖道院資訊系統" />
        <meta
          property="og:title"
          content={ogMeta?.ogTitle ?? "天一聖道院資訊系統"}
        ></meta>
        <meta
          property="og:description"
          content={ogMeta?.ogDescription ?? "天一聖道院資訊系統"}
        ></meta>
        <meta property="og:image" content={ogMeta?.ogImage ?? siteIcon}></meta>
        <meta name="theme-color" content={themeColor} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Analytics />
      <SessionProvider session={session}>
        <SiteProvider>
          <AuthGaurd>
            <SentrySetup>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </SentrySetup>
          </AuthGaurd>
        </SiteProvider>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
