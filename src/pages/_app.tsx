import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import Head from "next/head";
import AuthGaurd from "~/components/AuthGuard";
import Layout from "~/components/Layout";
import "~/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <>
      <Head>
        <title>天一聖道院道務系統</title>
        <meta name="description" content="天一聖道院道務系統" />
        <meta name="theme-color" content="#836b5d" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
