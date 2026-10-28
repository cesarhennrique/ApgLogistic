import { existsSync } from "node:fs";
import type { NextConfig } from "next";

// Optional GLBs that replace the procedural ship and truck cab: the URL is set only when the file exists.
const glb = (name: string) => (existsSync(`public/3d/models/${name}.glb`) ? `/3d/models/${name}.glb` : "");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  env: {
    NEXT_PUBLIC_SHIP_GLB: glb("ship"),
    NEXT_PUBLIC_TRUCK_CAB_GLB: glb("truck-cab"),
  },
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
