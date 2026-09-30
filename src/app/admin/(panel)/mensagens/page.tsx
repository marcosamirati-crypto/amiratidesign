import { deleteMessage, toggleRead } from "../../actions";
import { createAuthClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Msg = { id: string; name: string; email: string; message: string; read: boolean; created_at: string };

export default async function Messages() {
  const supabase = await createAuthClient();
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
  const msgs = (data ?? []) as Msg[];

  return (
    <>
      <h1 className="display text-4xl">Mensagens</h1>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {msgs.length === 0 && <li className="py-6 text-muted">Nenhuma mensagem.</li>}
        {msgs.map((m) => (
          <li key={m.id} className="py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {!m.read && <span aria-label="não lida" className="mr-2 inline-block size-2 rounded-full bg-accent" />}
                {m.name} · <a href={`mailto:${m.email}`} className="link-u text-muted">{m.email}</a>
              </p>
              <time className="text-sm text-muted">{new Date(m.created_at).toLocaleString("pt-BR")}</time>
            </div>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-muted">{m.message}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <form action={toggleRead}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="read" value={String(m.read)} />
                <button className="link-u text-muted hover:text-fg">{m.read ? "Marcar não lida" : "Marcar lida"}</button>
              </form>
              <form action={deleteMessage}>
                <input type="hidden" name="id" value={m.id} />
                <button className="link-u text-muted hover:text-fg">Excluir</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
