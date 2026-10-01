import Link from "next/link";

const nav = [
  { href: "/#trabalhos", label: "Trabalhos" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#contato", label: "Contato" },
];

/** Três âncoras, em uma pílula de branco translúcido, fixa no topo. */
export default function Header() {
  return (
    <header data-no-glow className="nav-pill-wrap">
      <nav aria-label="Principal" className="nav-pill">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="nav-link">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
