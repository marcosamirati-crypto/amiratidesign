import { experience } from "@/content/site";
import { percurso } from "@/content/story";

/** Converte **trecho** em <strong>. */
function rich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}

/** O percurso em prosa (com os nomes em destaque), seguido de um índice discreto para quem só quer varrer os olhos. */
export default function Percurso() {
  return (
    <section id="percurso" className="scroll-mt-16 border-t border-line px-[4.6vw] py-28 md:px-[3.2vw] md:py-44">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <h2 className="display text-[clamp(2.6rem,7vw,7.5rem)] md:col-span-5">{percurso.title}</h2>
        <div className="prosa space-y-7 md:col-span-7 md:col-start-6 md:space-y-9">
          {percurso.paragraphs.map((p, i) => (
            <p key={i}>{rich(p)}</p>
          ))}
        </div>
      </div>

      <div className="mt-24 grid gap-x-12 gap-y-12 text-sm md:mt-40 md:grid-cols-12">
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 md:col-span-8">
          {experience.jobs.map((j) => (
            <li key={j.place + j.period}>
              <p className="aside text-muted">{j.period}</p>
              <p className="mt-1 text-base font-semibold tracking-tight">{j.place}</p>
              {j.role && <p className="text-muted">{j.role}</p>}
            </li>
          ))}
        </ul>
        <ul className="grid gap-6 md:col-span-4">
          {experience.education.map((j) => (
            <li key={j.place}>
              <p className="aside text-muted">{j.period}</p>
              <p className="mt-1 text-base font-semibold tracking-tight">{j.place}</p>
              <p className="text-muted">{j.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
