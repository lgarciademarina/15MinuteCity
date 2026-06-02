import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/15MinuteCity",
  assetPrefix: "/15MinuteCity",
  trailingSlash: false,
  redirects: async () => [
    {
      source: "/",
      destination: "/15MinuteCity",
      permanent: true,
    },
  ],
};

export default nextConfig;
