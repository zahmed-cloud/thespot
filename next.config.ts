import type { NextConfig } from "next";

const isDeployed = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // frame-blocking only where it matters; local test harnesses
          // render the site in iframes
          ...(isDeployed
            ? [
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
              ]
            : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
