import { campo } from "@/content/story";

// Recuos diferentes: a própria disposição das cinco frentes desenha o campo de atuação.
const INDENT = ["0", "9vw", "3vw", "18vw", "7vw"];

/** Cinco palavras grandes, em escadinha; a nota de cada uma aparece ao passar o mouse (no mobile, sempre visível). */
export default function Campo() {
  return (
    <section aria-label="Campo de atuação" className="px-[4.6vw] pb-32 md:px-[3.2vw] md:pb-48">
      <ul className="flex flex-col gap-5 md:gap-4">
        {campo.map((c, i) => (
          <li key={c.word} className="campo-item" style={{ "--ind": INDENT[i] } as React.CSSProperties}>
            <span className="campo-word">{c.word}</span>
            <span className="campo-note aside">{c.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
