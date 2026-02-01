const path = require('path');
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

// Only wrap with Sentry if SENTRY_DSN is configured
const sentryEnabled = !!process.env.SENTRY_DSN;

module.exports = sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Sentry options
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    }, {
      // Upload options
      widenClientFileUpload: true,
      transpileClientSDK: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : nextConfig;
