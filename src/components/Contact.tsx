import ContactForm from "./ContactForm";
import Reveal from "./Reveal";
import { site } from "@/content/site";

/** Seção de contato reutilizável (home + páginas de projeto). */
export default function Contact() {
  return (
    <section id="contato" className="scroll-mt-16 border-t border-line py-24 md:py-40">
      <div className="container-x grid gap-16 md:grid-cols-2">
        <Reveal>
          <p className="mb-6 text-sm text-muted">/ Contato</p>
          <h2 className="display text-5xl md:text-7xl">
            Vamos fazer sua marca ser lembrada?
          </h2>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="btn mt-10 inline-block rounded-full bg-accent px-8 py-4 text-base font-medium text-on-accent"
          >
            Falar no WhatsApp
          </a>
          <p className="mt-10 space-y-1 text-muted">
            <a href={`mailto:${site.email}`} className="link-u block text-fg">
              {site.email}
            </a>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="link-u block">
              {site.instagram}
            </a>
            <a href={site.linkedinUrl} target="_blank" rel="noreferrer" className="link-u block">
              {site.linkedin}
            </a>
            <a href={site.whatsapp} target="_blank" rel="noreferrer" className="link-u block">
              {site.phone}
            </a>
          </p>
        </Reveal>
        <Reveal delay={80} className="md:pt-16">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}