import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the dev indicator (N icon) — clean UI for everyone
  devIndicators: false,
  // Enable server actions for form handling
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Image optimization for Supabase avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
