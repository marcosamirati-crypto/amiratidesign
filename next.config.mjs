/** @type {import('next').NextConfig} */
const config = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
  // Obra em 3D do TCC (arquivos estáticos em public/osipova). Fica em /osipova e fora do Google.
  async rewrites() {
    return [{ source: "/osipova", destination: "/osipova/index.html" }];
  },
  async headers() {
    return [{ source: "/osipova/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default config;
