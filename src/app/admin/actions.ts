"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuthClient, hasSupabase } from "@/lib/supabase/server";

export type AdminState = { error?: string } | null;

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ───────── Auth ─────────
export async function login(_p: AdminState, fd: FormData): Promise<AdminState> {
  if (!hasSupabase) return { error: "Configure o Supabase no .env.local primeiro." };
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: "E-mail ou senha inválidos." };
  redirect("/admin");
}

export async function logout() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ───────── Projetos ─────────
const BUCKET_MARK = "/object/public/projects/";

/** Apaga do Storage os arquivos (do nosso bucket) que deixaram de ser usados. */
async function removeFiles(supabase: Awaited<ReturnType<typeof createAuthClient>>, urls: string[]) {
  const paths = urls
    .filter((u) => u.includes(BUCKET_MARK))
    .map((u) => decodeURIComponent(u.split(BUCKET_MARK)[1].split("?")[0]));
  if (paths.length) await supabase.storage.from("projects").remove(paths);
}

const isUrl = (s: unknown): s is string => typeof s === "string" && /^(https?:\/\/|\/)/.test(s);

export async function saveProject(_p: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await createAuthClient();
  const id = String(fd.get("id") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Título é obrigatório." };
  const slug = slugify(String(fd.get("slug") ?? "") || title);

  try {
    // As imagens já foram enviadas do navegador direto ao Storage; aqui chegam só as URLs.
    let images: string[] = [];
    try {
      const parsed = JSON.parse(String(fd.get("images_json") ?? "[]"));
      images = Array.isArray(parsed) ? parsed.filter(isUrl) : [];
    } catch {
      return { error: "Lista de imagens inválida. Recarregue a página." };
    }
    let highlights: string[] = [];
    try {
      const h = JSON.parse(String(fd.get("highlights_json") ?? "[]"));
      const set = new Set(Array.isArray(h) ? h.filter(isUrl) : []);
      highlights = images.filter((u) => set.has(u)); // mural segue a ordem das imagens
    } catch {}
    let joined: string[] = [];
    try {
      const j = JSON.parse(String(fd.get("joined_json") ?? "[]"));
      const set = new Set(Array.isArray(j) ? j.filter(isUrl) : []);
      // a 1ª do mural nunca é "colada"; só vale para quem é destaque
      joined = highlights.filter((u, i) => i > 0 && set.has(u));
    } catch {}
    const coverRaw = String(fd.get("cover_url") ?? "");
    const cover = isUrl(coverRaw) ? coverRaw : (images[0] ?? null);

    const row = {
      slug,
      title,
      client: String(fd.get("client") ?? "") || null,
      type: String(fd.get("type") ?? "identidade-visual"),
      year: Number(fd.get("year")) || null,
      summary: String(fd.get("summary") ?? "") || null,
      external_url: String(fd.get("external_url") ?? "") || null,
      sort_order: Number(fd.get("sort_order")) || 0,
      published: fd.get("published") === "on",
      cover_url: cover,
      images,
      highlights,
      joined,
      updated_at: new Date().toISOString(),
    };

    let old: { images: string[]; cover_url: string | null } | null = null;
    if (id) {
      const { data } = await supabase.from("projects").select("images, cover_url").eq("id", id).single();
      old = data;
    }

    const save = (r: Record<string, unknown>) =>
      id ? supabase.from("projects").update(r).eq("id", id) : supabase.from("projects").insert(r);
    let { error } = await save(row);
    if (error && /joined/.test(error.message)) {
      // coluna "joined" ainda não criada no Supabase: salva o resto e avisa
      const { joined: _omit, ...rest } = row;
      ({ error } = await save(rest));
      if (!error) return { error: "Salvo, mas as trincas coladas só funcionam depois de rodar o SQL 0003_joined.sql no Supabase." };
    }
    if (error) return { error: error.code === "23505" ? "Já existe um projeto com esse slug." : error.message };

    if (old) {
      const keep = new Set([...images, cover].filter(Boolean));
      await removeFiles(supabase, [...old.images, old.cover_url ?? ""].filter((u) => u && !keep.has(u)));
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar." };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteProject(fd: FormData) {
  const supabase = await createAuthClient();
  const id = String(fd.get("id"));
  const { data } = await supabase.from("projects").select("images, cover_url").eq("id", id).single();
  await supabase.from("projects").delete().eq("id", id);
  if (data) await removeFiles(supabase, [...data.images, data.cover_url ?? ""].filter(Boolean));
  revalidatePath("/", "layout");
}

export async function togglePublished(fd: FormData) {
  const supabase = await createAuthClient();
  await supabase
    .from("projects")
    .update({ published: fd.get("published") !== "true" })
    .eq("id", String(fd.get("id")));
  revalidatePath("/", "layout");
}

// ───────── Mensagens ─────────
export async function toggleRead(fd: FormData) {
  const supabase = await createAuthClient();
  await supabase.from("messages").update({ read: fd.get("read") !== "true" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/mensagens");
}

export async function deleteMessage(fd: FormData) {
  const supabase = await createAuthClient();
  await supabase.from("messages").delete().eq("id", String(fd.get("id")));
  revalidatePath("/admin/mensagens");
}
