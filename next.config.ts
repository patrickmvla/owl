import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  // cacheComponents requires all dynamic access (usePathname, cookies, etc.)
  // to be inside <Suspense>. Our icon rail uses usePathname in the layout.
  // Deferring PPR until the layout is refactored for server/client split.
  // Suspense boundaries still work without this flag — they just stream
  // client components instead of prerendering static shells.
};

const config = process.env.ANALYZE === "true"
  ? withBundleAnalyzer({ enabled: true })(nextConfig)
  : nextConfig;

export default config;
