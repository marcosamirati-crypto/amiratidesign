import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBriefing, toggleRead } from "../../../actions";
import CopyText from "../CopyText";
import { answerOf, isBriefing, parseBriefing, whatsappLink } from "@/lib/briefing";
import { createAuthClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = { id: string; name: string; email: string; message: string; read: boolean; created_at: string };

export default async function BriefingFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAuthClient();
  const { data } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
  const row = data as Row | null;
  if (!row || !isBriefing(row.name)) notFound();

  // Abrir a ficha conta como "lido" (dá para voltar a "não lido" no botão).
  if (!row.read) await supabase.from("messages").update({ read: true }).eq("id", id);

  const b = parseBriefing(row.name, row.email, row.message);
  const primeiro = b.nome.split(" ")[0];
  const wa = b.whatsapp ? whatsappLink(b.whatsapp, `Oi, ${primeiro}! Aqui é o Amirati. Recebi seu briefing da ${b.empresa} e já estou lendo.`) : null;
  const destaques = [
    ["Objetivo", answerOf(b, "objetivo")],
    ["Prazo e investimento", answerOf(b, "prazo")],
    ["Três palavras", answerOf(b, "palavras")],
    ["O que já existe", answerOf(b, "existente")],
  ].filter(([, v]) => v);
  const data_ = new Date(row.created_at).toLocaleString("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "long", timeStyle: "short" });

  return (
    <article className="max-w-4xl">
      <Link href="/admin/briefings" className="link-u text-sm text-muted hover:text-fg">← Todos os briefings</Link>

      <header className="mt-8">
        <p className="text-sm text-muted">Recebido em {data_}</p>
        <h1 className="display mt-3 text-5xl break-words md:text-6xl">{b.empresa}</h1>
        <p className="mt-4 text-lg text-muted">
          {b.nome} · <a href={`mailto:${b.email}`} className="link-u">{b.email}</a>
          {b.whatsapp && <> · {b.whatsapp}</>}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="btn rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent">
              Chamar no WhatsApp
            </a>
          )}
          <a
            href={`mailto:${b.email}?subject=${encodeURIComponent(`Seu briefing — ${b.empresa}`)}`}
            className={`btn rounded-full px-5 py-2.5 text-sm font-medium ${wa ? "border border-line" : "bg-accent text-on-accent"}`}
          >
            Responder por e-mail
          </a>
          <CopyText text={row.message} />
        </div>
      </header>

      {destaques.length > 0 && (
        <dl className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
          {destaques.map(([k, v]) => (
            <div key={k} className="bg-bg p-6">
              <dt className="text-xs uppercase tracking-widest text-muted">{k}</dt>
              <dd className="mt-2 text-lg leading-snug">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <ol className="mt-14 divide-y divide-line border-y border-line">
        {b.answers.length === 0 && <li className="whitespace-pre-wrap py-6 text-muted">{row.message}</li>}
        {b.answers.map((a) => {
          const vazio = !a.answer || a.answer === "(sem resposta)";
          return (
            <li key={a.n} className="grid gap-3 py-7 md:grid-cols-[3rem_1fr]">
              <span className="display text-2xl text-muted">{String(a.n).padStart(2, "0")}</span>
              <div>
                <h2 className="font-medium">{a.title}</h2>
                <p className={`mt-2 max-w-2xl whitespace-pre-wrap leading-relaxed ${vazio ? "text-muted italic" : ""}`}>
                  {vazio ? "Sem resposta" : a.answer}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {b.truncated && <p className="mt-4 text-sm text-muted">O texto era longo e foi cortado no fim ao ser salvo. O e-mail de aviso traz a versão completa.</p>}

      <footer className="mt-10 flex gap-5 text-sm">
        <form action={toggleRead}>
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="read" value="true" />
          <button className="link-u text-muted hover:text-fg">Marcar como não lido</button>
        </form>
        <form action={deleteBriefing}>
          <input type="hidden" name="id" value={row.id} />
          <button className="link-u text-muted hover:text-fg">Excluir briefing</button>
        </form>
      </footer>
    </article>
  );
}
