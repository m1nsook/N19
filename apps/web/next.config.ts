import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browser requests remain on the web origin; the API only listens on loopback.
  async rewrites() {
    return [{ source: "/api/n19/:path*", destination: "http://127.0.0.1:4190/:path*" }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
