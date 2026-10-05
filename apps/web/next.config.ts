import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un servidor autocontenido en .next/standalone (lo usa el Dockerfile)
  output: "standalone",
};

export default nextConfig;
