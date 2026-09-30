import Link from "next/link";
import { logout } from "../actions";
import ThemeToggle from "@/components/ThemeToggle";

// Layout do painel. Novas áreas (ex.: Propostas) entram como itens em `nav` + uma pasta em (panel)/.
// TODO (backlog): { href: "/admin/propostas", label: "Propostas" } — ver (panel)/propostas/README.md
const nav = [
  { href: "/admin", label: "Projetos" },
  { href: "/admin/mensagens", label: "Mensagens" },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <aside className="flex items-center justify-between gap-4 border-b border-line p-4 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:p-6">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">Admin</Link>
        <nav className="flex gap-4 text-sm md:mt-8 md:flex-col md:gap-3">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="link-u self-start text-muted hover:text-fg">{n.label}</Link>
          ))}
          <Link href="/" target="_blank" className="link-u self-start text-muted hover:text-fg">Ver site ↗</Link>
        </nav>
        <div className="flex items-center gap-3 md:mt-auto">
          <ThemeToggle />
          <form action={logout}>
            <button className="btn text-sm text-muted hover:text-fg">Sair</button>
          </form>
        </div>
      </aside>
      <main className="p-5 md:p-10">{children}</main>
    </div>
  );
}
