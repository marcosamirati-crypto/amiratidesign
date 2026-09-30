// Gera imagens SVG placeholder (capas/galeria do seed). Removível quando houver imagens reais.
const palettes = [
  ["#1a1a1a", "#ea0637", "#f5f5f5"],
  ["#f2efe9", "#111111", "#ea0637"],
  ["#ea0637", "#0a0a0a", "#ffffff"],
  ["#2a2a2a", "#8a8a8a", "#ffffff"],
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const clean = name.replace(/[^a-z0-9-]/gi, "");
  const idx = Number(clean.split("-").pop()) || 0;
  const label = clean.replace(/-\d+$/, "").replace(/-/g, " ").toUpperCase();
  const h = hash(clean.replace(/-\d+$/, ""));
  const [bg, a, fg] = palettes[(h + idx) % palettes.length];
  const r = 120 + ((h >> 3) % 200) + idx * 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" width="1600" height="1200">
<rect width="1600" height="1200" fill="${bg}"/>
<circle cx="${idx % 2 ? 1100 : 500}" cy="${idx > 1 ? 800 : 420}" r="${r}" fill="${a}"/>
<rect x="${200 + idx * 60}" y="${900 - idx * 40}" width="360" height="12" fill="${fg}"/>
<text x="200" y="1020" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="88" fill="${fg}">${label}</text>
<text x="200" y="1090" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${fg}" opacity=".6">PLACEHOLDER 0${idx + 1}</text>
</svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
