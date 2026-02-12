// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;

    // 2. LOGGING PENTING: Cek log docker frontend nanti untuk melihat nilai ini
    console.log("-----------------------------------------");
    console.log("   REWRITE TARGET BACKEND_URL:", backendUrl);
    console.log("-----------------------------------------");

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl?.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
