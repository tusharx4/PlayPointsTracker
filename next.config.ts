import type { NextConfig } from "next";

// The normal build keeps the Next.js server and PostgreSQL health endpoint.
// scripts/build-pages.mjs creates an isolated, static-only GitHub Pages build.
const isStaticExport = process.env.PLAY_POINTS_STATIC_EXPORT === "1";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

if (basePath && (!/^\/[A-Za-z0-9._/-]+$/.test(basePath) || basePath.split("/").some((part) => part === "." || part === ".."))) {
  throw new Error("NEXT_PUBLIC_BASE_PATH must be empty or a repository path such as /play-points.");
}

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isStaticExport
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
