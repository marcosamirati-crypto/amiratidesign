import Link from "next/link";
import { answerOf, BRIEFING_PREFIX, parseBriefing } from "@/lib/briefing";
import { hasNotify } from "@/lib/notify";
import { createAuthClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = { id: string; name: string; email: string; message: string; read: boolean; created_at: string };

const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Fortaleza", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function Briefings() {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .like("name", `${BRIEFING_PREFIX}%`)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const novos = rows.filter((r) => !r.read).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">/ marcosamirati.com/briefing</p>
          <h1 className="display mt-2 text-4xl">Briefings</h1>
        </div>
        <p className="text-sm text-muted">
          {rows.length} {rows.length === 1 ? "resposta" : "respostas"}
          {novos > 0 && <> · <span className="font-medium text-fg">{novos} {novos === 1 ? "nova" : "novas"}</span></>}
        </p>
      </div>

      {!hasNotify && (
        <p className="mt-6 max-w-2xl rounded-2xl border border-line p-4 text-sm text-muted">
          Aviso por e-mail ainda desligado. Para receber um e-mail a cada briefing, adicione <code>RESEND_API_KEY</code> e{" "}
          <code>BRIEFING_NOTIFY_TO</code> nas variáveis do projeto na Vercel.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-10 border-y border-line py-6 text-muted">Nenhum briefing ainda. Quando alguém responder, aparece aqui.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const b = parseBriefing(r.name, r.email, r.message);
            const objetivo = answerOf(b, "objetivo");
            const prazo = answerOf(b, "prazo");
            const negocio = answerOf(b, "negocio");
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/briefings/${r.id}`}
                  className={`group flex h-full flex-col rounded-3xl border p-6 transition-colors hover:border-fg ${r.read ? "border-line" : "border-accent"}`}
                >
                  <div className="flex items-center justify-between gap-3 text-xs text-muted">
                    <time>{when(r.created_at)}</time>
                    {!r.read && <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-on-accent">Novo</span>}
                  </div>
                  <h2 className="display mt-5 text-3xl break-words">{b.empresa}</h2>
                  <p className="mt-2 text-sm text-muted">{b.nome}</p>
                  {negocio && <p className="mt-4 line-clamp-3 text-sm">{negocio}</p>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {objetivo && <span className="rounded-full bg-surface-2 px-3 py-1 text-xs">{objetivo.split(" — ")[0]}</span>}
                    {prazo && <span className="rounded-full bg-surface-2 px-3 py-1 text-xs">{prazo.split(" — ")[0]}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
