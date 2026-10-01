import HeroMotion from "./HeroMotion";
import { hero } from "@/content/story";

/** Cada palavra vira um conjunto de letras (para a entrada por letra e o peso que reage ao cursor). */
function Letters({ text, offset }: { text: string; offset: number }) {
  let i = offset;
  return (
    <>
      {text.split(" ").map((word, w) => (
        <span key={w} className="hero-word" aria-hidden>
          {Array.from(word).map((ch) => (
            <span key={i} data-letter className="hero-letter" style={{ "--i": i++ } as React.CSSProperties}>
              {ch}
            </span>
          ))}
          {w < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

/**
 * Pôster de entrada. O fundo cinza do estúdio da foto vira a cor da própria página (a foto se dissolve
 * nas bordas), e o título, em mix-blend-mode: difference, cruza o retrato e o corte para o preto sem
 * perder leitura. O título NÃO passa por cima do rosto.
 */
export default function Hero() {
  const [l1, l2, l3] = hero.lines;
  return (
    <section id="hero" aria-label="Apresentação" className="hero">
      <div className="hero-photo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/amirati-portrait.jpg"
          alt={hero.alt}
          width={854}
          height={1280}
          fetchPriority="high"
          draggable={false}
          data-no-glow
          className="hero-photo"
        />
      </div>

      <h1 className="hero-title" data-hero-title aria-label={hero.lines.join(" ")}>
        <span className="hero-line hero-l1"><Letters text={l1} offset={0} /></span>
        <span className="hero-line hero-l2"><Letters text={l2} offset={l1.length} /></span>
        <span className="hero-line hero-l3"><Letters text={l3} offset={l1.length + l2.length} /></span>
      </h1>

      <p className="hero-note hero-note-top">{hero.noteTop}</p>
      <p className="hero-note hero-note-mid">{hero.noteMid}</p>
      <p className="hero-note hero-note-bottom">{hero.noteBottom}</p>

      <HeroMotion />
    </section>
  );
}
