import type { NextConfig } from "next";

import { PRODUCT_IMAGE_HOST } from "./src/entities/product/lib/image";

const nextConfig: NextConfig = {
  images: {
    // Product images for the Algolia demo index are all served from this CDN.
    // Same constant the ProductCard host-guard uses, so config and guard agree.
    remotePatterns: [
      { protocol: "https", hostname: PRODUCT_IMAGE_HOST, pathname: "/**" },
    ],
  },
};

export default nextConfig;
