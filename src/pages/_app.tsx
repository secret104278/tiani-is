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
  if (isYideclass) themeColor = "#5c7f67";
  else if (isVolunteer) themeColor = "#d69c6c";

  let siteTitle = "天一聖道院資訊系統";
  if (isYideclass) siteTitle = "義德班務網";
  else if (isVolunteer) siteTitle = "天一志工隊";

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">⚒️ 維護中 ⚒️</h1>
          <p className="py-6">天一聖道院資訊系統</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>{ogMeta?.ogTitle ?? siteTitle}</title>
        <meta name="description" content={`${siteTitle}・天一聖道院資訊系統`} />
        <meta property="og:title" content={ogMeta?.ogTitle ?? siteTitle}></meta>
        <meta
          property="og:description"
          content={ogMeta?.ogDescription ?? `${siteTitle}・天一聖道院資訊系統`}
        ></meta>
        <meta property="og:image" content={ogMeta?.ogImage ?? siteIcon}></meta>
        <meta name="theme-color" content={themeColor} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <Analytics /> */}
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
