import type { NextConfig } from "next";

// In Docker, nginx routes /api to FastAPI before requests reach Next.js. The rewrite
// below only matters for local development (`npm run dev` against uvicorn on :8000).
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
