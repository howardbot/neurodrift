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
  // Files in public/ are otherwise sent with max-age=0, so every visit revalidates them.
  // Only the asset directory: /research/<slug> are pages, whose HTML must not be cached.
  // Later entries win when several match, so the immutable rule comes last.
  async headers() {
    return [
      {
        source: "/research/marmoset/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        // Content-hashed copies from scripts/convert-figures.py (name.<10 hex>.webp): a new
        // version always gets a new name, so they can be cached for good.
        source: "/research/marmoset/:file([^/]+\\.[0-9a-f]{10}\\.webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
