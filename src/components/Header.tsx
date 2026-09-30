import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { site } from "@/content/site";

const nav = [
  { href: "/#trabalhos", label: "Trabalhos" },
  { href: "/#experiencia", label: "Experiência" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#processo", label: "Processo" },
  { href: "/#contato", label: "Contato" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {site.name}
          <span className="text-accent">.</span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="link-u text-muted hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/#contato"
            className="btn rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent"
          >
            Falar
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
