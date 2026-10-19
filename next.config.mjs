/** @type {import('next').NextConfig} */
const config = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
  // Obra em 3D do TCC (arquivos estáticos em public/osipova). Fica em /osipova e fora do Google.
  // Protótipo do app I'Club (build estático em public/iclub). As telas do app (/iclub/inicio etc.)
  // caem no index.html; os arquivos de public/iclub são servidos antes destas regras.
  async rewrites() {
    return [
      { source: "/osipova", destination: "/osipova/index.html" },
      { source: "/iclub", destination: "/iclub/index.html" },
      { source: "/iclub/:path*", destination: "/iclub/index.html" },
    ];
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/osipova/:path*", headers: noindex },
      { source: "/iclub/:path*", headers: noindex },
    ];
  },
};

export default config;
