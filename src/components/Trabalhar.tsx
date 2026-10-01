import { deliverables, services } from "@/content/site";
import { trabalhar } from "@/content/story";

/** Como é trabalhar comigo: uma conversa, três tamanhos de identidade e social media por peça. Sem tabela de preços. */
export default function Trabalhar() {
  const tiers = services[0].tiers;
  const lista = deliverables.map((d) => d.title.toLowerCase());
  const entregas = `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;

  return (
    <section className="border-t border-line px-[4.6vw] py-28 md:px-[3.2vw] md:py-44">
      <div className="grid gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <h2 className="display text-[clamp(2.6rem,7vw,7.5rem)]">{trabalhar.title}</h2>
          <p className="prosa mt-8 max-w-lg">{trabalhar.lead}</p>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <p className="aside text-[1.15rem] text-muted">{trabalhar.identidade}</p>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {tiers.map((t) => (
              <li key={t.name} className="grid items-baseline gap-2 py-5 md:grid-cols-[9rem_1fr] md:gap-8">
                <span className="text-[clamp(2rem,3.6vw,3.4rem)] font-semibold leading-none tracking-[-0.04em]">{t.name}</span>
                <span className="text-muted">{t.line}</span>
              </li>
            ))}
          </ul>

          <p className="aside mt-12 text-[1.15rem] text-muted">{trabalhar.social}</p>
          <p className="mt-6 max-w-md text-muted">
            O que costuma sair dessa conversa: {entregas}.
          </p>
        </div>
      </div>
    </section>
  );
}
