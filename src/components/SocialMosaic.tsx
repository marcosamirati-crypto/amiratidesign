"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Reveal from "./Reveal";

export type MosaicPost = { src: string; slug: string; title: string };

const DEFAULT_RATIO = 0.8; // 4:5 até a imagem carregar
const MAX_ROW = 2.05; // soma máxima das proporções numa linha
const TARGET_ROW = 1.7; // soma ideal (dois posts 4:5 = 1,6)

/**
 * Mural para celular: linhas "justificadas". Cada linha reúne posts na ordem, e a largura de cada um é
 * proporcional ao formato real da imagem, então todos ficam com a mesma altura: sem cortar nada e sem espaços vazios.
 * Trincas contínuas (posts colados) viajam juntas, lado a lado e sem espaço entre elas.
 */
export default function SocialMosaic({ blocks, className = "" }: { blocks: MosaicPost[][]; className?: string }) {
  const [ratios, setRatios] = useState<Record<string, number>>({});

  const report = useCallback((src: string, img: HTMLImageElement) => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const r = img.naturalWidth / img.naturalHeight;
    setRatios((prev) => (prev[src] && Math.abs(prev[src] - r) < 0.005 ? prev : { ...prev, [src]: r }));
  }, []);

  const units = blocks.map((posts) => ({
    posts,
    ar: posts.reduce((s, p) => s + (ratios[p.src] ?? DEFAULT_RATIO), 0),
  }));

  const rows: (typeof units)[] = [];
  let cur: typeof units = [];
  let sum = 0;
  for (const u of units) {
    const fits =
      cur.length > 0 && sum + u.ar <= MAX_ROW && (sum < 1.2 || Math.abs(sum + u.ar - TARGET_ROW) <= Math.abs(sum - TARGET_ROW));
    if (cur.length === 0 || fits) {
      cur.push(u);
      sum += u.ar;
    } else {
      rows.push(cur);
      cur = [u];
      sum = u.ar;
    }
  }
  if (cur.length) rows.push(cur);

  let n = 0;
  return (
    <div className={className}>
      {rows.map((row, ri) => (
        <div key={ri} className="mb-3 flex gap-3">
          {row.map((u) => (
            <div key={u.posts[0].src} className="min-w-0" style={{ flex: `${Math.round(u.ar * 1000)} 1 0%` }}>
              <Reveal delay={(n++ % 3) * 50}>
                <div className="flex">
                  {u.posts.map((p) => (
                    <Link
                      key={p.src}
                      href={`/projetos/${p.slug}`}
                      className="card block min-w-0"
                      style={{ flex: `${Math.round((ratios[p.src] ?? DEFAULT_RATIO) * 1000)} 1 0%` }}
                      aria-label={`Ver projeto ${p.title}`}
                    >
                      <div className="card-img overflow-hidden bg-surface-2" style={{ aspectRatio: String(ratios[p.src] ?? DEFAULT_RATIO) }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.src}
                          alt={`Post de ${p.title}`}
                          className="block h-full w-full"
                          loading="lazy"
                          ref={(el) => {
                            if (el && el.complete) report(p.src, el);
                          }}
                          onLoad={(e) => report(p.src, e.currentTarget)}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
