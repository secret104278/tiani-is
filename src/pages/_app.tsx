import { Analytics } from "@vercel/analytics/react";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import Head from "next/head";
import AuthGaurd from "~/components/AuthGuard";
import Layout from "~/components/Layout";

import "leaflet/dist/leaflet.css";
import "~/styles/globals.css";
import type { OGMetaProps } from "~/utils/types";

const MyApp: AppType<{ session: Session | null; ogMeta?: OGMetaProps }> = ({
  Component,
  pageProps: { session, ogMeta, ...pageProps },
}) => {
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
        <meta
          property="og:image"
          content={ogMeta?.ogImage ?? "/logo512.png"}
        ></meta>
        <meta name="theme-color" content="#836b5d" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Analytics />
      <SessionProvider session={session}>
        <AuthGaurd>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AuthGaurd>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
