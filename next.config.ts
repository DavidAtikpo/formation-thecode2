import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'tesseract.js-core', 'puppeteer'],
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
