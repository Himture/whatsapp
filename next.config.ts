import type { NextConfig } from "next";

// Content-Security-Policy is set per-request with a nonce in src/middleware.ts.
// The remaining headers are static and applied to every response here.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "idb"],
  },
  logging: {
    browserToTerminal: "error",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
