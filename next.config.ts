import type { NextConfig } from "next";

const nextConfig: NextConfig = { async headers() { return [{source:"/reset-password",headers:[{key:"Referrer-Policy",value:"no-referrer"},{key:"Cache-Control",value:"private, no-store"}]}]; }, outputFileTracingIncludes: { "/*": ["./assets/fonts/**/*"] }, experimental: { serverActions: { bodySizeLimit: "1mb" } } };

export default nextConfig;
