import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  images: {
    // Next.js refuses to optimize images from domains it doesn't know
    // about — that's why every <Image> in this codebase had `unoptimized`
    // hardcoded on it. This whitelists Supabase Storage's public object
    // URLs (covers both the `device-images` and `avatars` buckets, on
    // whatever your project ref is).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Serve AVIF/WebP automatically when the browser supports it —
    // both are 30–50% smaller than the JPG/PNG sellers upload.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
