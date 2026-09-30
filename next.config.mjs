/** @type {import('next').NextConfig} */
const config = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
};

export default config;
