import { withSentryConfig } from "@sentry/nextjs";
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const innerConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["zh-TW"],
    defaultLocale: "zh-TW",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
        port: "",
        pathname: "/*",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/*",
      },
    ],
  },

  redirects() {
    return Promise.resolve([
      {
        source: "/",
        destination: "/volunteer",
        permanent: false,
      },
      {
        source: "/volunteeractivity/:path*",
        destination: "/volunteer/activity/:path*",
        permanent: false,
      },
      {
        source: "/yideclass",
        destination: "/class/yide",
        permanent: false,
      },
      {
        source: "/yideclass/activity/:path*",
        destination: "/class/activity/:path*",
        permanent: false,
      },
      {
        source: "/yideclass/:unit",
        destination: "/class/yide", // Fallback for old unit names to yide slug
        permanent: false,
      },
      {
        source: "/yidework",
        destination: "/work",
        permanent: false,
      },
      {
        source: "/yidework/:path*",
        destination: "/work/:path*",
        permanent: false,
      },
    ]);
  },
};

const config =
  process.env.NODE_ENV === "production"
    ? withSentryConfig(innerConfig, {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        org: "838daf674b1f",
        project: "tiani-is",

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Automatically annotate React components to show their full name in breadcrumbs and session replay
        reactComponentAnnotation: {
          enabled: true,
        },

        // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        // tunnelRoute: "/monitoring",

        // Hides source maps from generated client bundles
        hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
      })
    : innerConfig;

export default config;
