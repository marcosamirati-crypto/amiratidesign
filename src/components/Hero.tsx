/**
 * Capa. No desktop (tela larga) a foto e o título ficam em um "palco" 16:9 que cobre a tela: tudo é
 * posicionado em % do palco, então o título mantém sempre a mesma relação com o braço. Uma segunda
 * cópia da foto, recortada só no contorno do braço, fica POR CIMA do título: o texto passa por trás.
 * Em tela alta (celular/tablet em pé) a foto ocupa a tela inteira, recortada na pessoa, e o título fica centralizado
 * logo acima do antebraço, também passando por trás dele. Como a foto é "cover" com posição fixa, o contorno do braço
 * é recalculado em px a partir da altura da capa (--iw = largura da foto exibida, --ox = quanto ela sai pela esquerda).
 */

// Contorno superior do antebraço (em % do quadro 1920×1080), de cima do cotovelo até a mão, fechando por baixo.
const ARM = [
  [24.87, 42.13], [25.65, 45.37], [26.69, 49.07], [27.47, 51.62], [28.91, 51.62], [30.21, 52.08],
  [31.51, 52.78], [33.46, 53.15], [35.42, 52.87], [36.72, 52.69], [38.02, 53.01], [39.58, 54.86],
  [39.58, 66], [20, 66], [20, 42.13],
];
const ARM_CLIP = `polygon(${ARM.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
const ARM_CLIP_M = `polygon(${ARM.map(([x, y]) => `calc(var(--ox) + var(--iw) * ${x / 100}) ${y}%`).join(", ")})`;

const ALT =
  "Retrato de Amirati sentado, de camiseta escura, segurando um óculos de lentes vermelhas, sob luz vermelha em degradê";

export default function Hero() {
  return (
    <section id="hero" aria-label="Capa" className="hero">
      <div className="hero-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/capa-vermelha.webp" alt={ALT} width={1920} height={1080} fetchPriority="high" draggable={false} data-no-glow className="hero-img" />

        <h1 className="hero-title">
          <span className="hero-light">Oi! Eu sou o</span> <span className="hero-bold">Amirati!</span>
        </h1>

        {/* Cópia recortada do braço, acima do título (só decorativa) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/capa-vermelha.webp" alt="" aria-hidden width={1920} height={1080} draggable={false} data-no-glow className="hero-img hero-arm" style={{ "--arm-d": ARM_CLIP, "--arm-m": ARM_CLIP_M } as React.CSSProperties} />

        <a href="#trabalhos" className="hero-arrow" aria-label="Ver os trabalhos">
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17 4v34M5 27l12 12 12-12" />
          </svg>
        </a>
      </div>
    </section>
  );
}
