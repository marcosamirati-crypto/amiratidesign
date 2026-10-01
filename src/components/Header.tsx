import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { site } from "@/content/site";

const nav = [
  { href: "/#marcas", label: "Marcas", mobile: true },
  { href: "/#feed", label: "Feed" },
  { href: "/#fotografia", label: "Fotografia" },
  { href: "/#percurso", label: "Percurso" },
  { href: "/#contato", label: "Contato", mobile: true },
];

/** Fixo e sem fundo: a mistura "difference" (CSS .site-header) o deixa legível sobre cinza, preto e branco. */
export default function Header() {
  return (
    <header data-no-glow className="site-header fixed inset-x-0 top-0 z-50">
      <div className="flex h-16 items-center justify-between px-[4.6vw] md:px-[3.2vw]">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {site.name.split(" ")[0]}
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-5 text-sm md:gap-8">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`link-u ${n.mobile ? "" : "hidden md:inline"}`}>
              {n.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
