import ContactForm from "./ContactForm";
import { site } from "@/content/site";
import { contato } from "@/content/story";

/** Contato: o e-mail em tamanho de título, o resto em voz baixa. Reutilizada nas páginas de projeto. */
export default function Contact() {
  return (
    <section id="contato" className="scroll-mt-16 border-t border-line px-[4.6vw] py-28 md:px-[3.2vw] md:py-44">
      <p className="aside text-[1.15rem] text-muted">{contato.title}</p>
      <a
        href={`mailto:${site.email}`}
        className="link-u mt-6 block break-words text-[clamp(1.9rem,6.6vw,7.4rem)] font-semibold leading-[1] tracking-[-0.045em]"
      >
        {site.email}
      </a>

      <div className="mt-16 grid gap-16 md:mt-28 md:grid-cols-12">
        <div className="md:col-span-5">
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="btn inline-block rounded-full bg-accent px-8 py-4 font-medium text-on-accent"
          >
            Chamar no WhatsApp
          </a>
          <ul className="mt-10 space-y-1.5 text-muted">
            <li>
              <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="link-u">
                {site.instagram}
              </a>
            </li>
            <li>
              <a href={site.linkedinUrl} target="_blank" rel="noreferrer" className="link-u">
                {site.linkedin}
              </a>
            </li>
            <li>{site.phone}</li>
          </ul>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
