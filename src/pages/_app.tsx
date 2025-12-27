import { Analytics } from "@vercel/analytics/next";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppType } from "next/app";

import { api } from "~/utils/api";

import Head from "next/head";
import AuthGaurd from "~/components/System/AuthGuard";
import Layout from "~/components/System/Layout";

import AccountSwitcher from "~/components/Dev/AccountSwitcher";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/router";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { useEffect } from "react";
import SentrySetup from "~/components/System/SentrySetup";
import { Loading } from "~/components/utils/Loading";
import { SiteProvider } from "~/context/SiteContext";
import { usePageLoading } from "~/hooks/usePageLoading";
import "~/styles/globals.css";
import type { OGMetaProps } from "~/utils/types";
import { Site, siteToTitle, urlBaseToSite } from "~/utils/ui";

const MyApp: AppType<{ session: Session | null; ogMeta?: OGMetaProps }> = ({
  Component,
  pageProps: { session, ogMeta, ...pageProps },
}) => {
  const router = useRouter();
  // FIXME: use site context
  const site = urlBaseToSite(router.pathname.split("/")[1]);

  useEffect(() => {
    switch (site) {
      case Site.Yideclass:
        document.documentElement.setAttribute("data-theme", "garden");
        break;
      case Site.Volunteer:
        document.documentElement.setAttribute("data-theme", "autumn");
        break;
      case Site.Etogether:
        document.documentElement.setAttribute("data-theme", "fantasy");
        break;
    }
  }, [site]);

  const { isPageLoading } = usePageLoading();

  let siteIcon = "/logo512.png";
  let siteColor = "";
  const siteTitle = siteToTitle(site);

  switch (site) {
    case Site.Yideclass:
      siteIcon = "/yideclass_logo.png";
      siteColor = "#5c7f67";
      break;
    case Site.Volunteer:
      siteIcon = "/volunteer_logo.png";
      siteColor = "#d69c6c";
      break;
    case Site.Etogether:
      siteIcon = "/etogether_logo.png";
      siteColor = "#6d0c75";
      break;
  }

  // return (
  //   <div className="hero min-h-screen bg-base-200">
  //     <div className="hero-content text-center">
  //       <div className="max-w-md">
  //         <h1 className="text-5xl font-bold">⚒️ 維護中 ⚒️</h1>
  //         <p className="py-6">天一聖道院資訊系統</p>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <>
      <Head>
        <title>{ogMeta?.ogTitle ?? siteTitle}</title>
        <meta name="description" content={`${siteTitle}・天一聖道院資訊系統`} />
        <meta property="og:title" content={ogMeta?.ogTitle ?? siteTitle} />
        <meta
          property="og:description"
          content={ogMeta?.ogDescription ?? `${siteTitle}・天一聖道院資訊系統`}
        />
        <meta property="og:image" content={ogMeta?.ogImage ?? siteIcon} />
        <meta name="theme-color" content={siteColor} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Analytics />
      <SessionProvider session={session}>
        <SiteProvider>
          <AuthGaurd>
            <SentrySetup>
              <NuqsAdapter>
                <Layout>
                  {isPageLoading ? <Loading /> : <Component {...pageProps} />}
                </Layout>
                {process.env.NODE_ENV === "development" && <AccountSwitcher />}
              </NuqsAdapter>
            </SentrySetup>
          </AuthGaurd>
        </SiteProvider>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
