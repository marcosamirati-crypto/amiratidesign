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
async function upload(supabase: Awaited<ReturnType<typeof createAuthClient>>, file: File, slug: string) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("projects").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("projects").getPublicUrl(path).data.publicUrl;
}

export async function saveProject(_p: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await createAuthClient();
  const id = String(fd.get("id") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Título é obrigatório." };
  const slug = slugify(String(fd.get("slug") ?? "") || title);

  try {
    let cover = String(fd.get("cover_url") ?? "") || null;
    const coverFile = fd.get("cover") as File | null;
    if (coverFile && coverFile.size > 0) cover = await upload(supabase, coverFile, slug);

    const removed = new Set(fd.getAll("remove_images").map(String));
    const images = fd.getAll("existing_images").map(String).filter((u) => !removed.has(u));
    for (const f of fd.getAll("images") as File[]) {
      if (f && f.size > 0) images.push(await upload(supabase, f, slug));
    }

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
      updated_at: new Date().toISOString(),
    };

    const { error } = id
      ? await supabase.from("projects").update(row).eq("id", id)
      : await supabase.from("projects").insert(row);
    if (error) return { error: error.code === "23505" ? "Já existe um projeto com esse slug." : error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar." };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteProject(fd: FormData) {
  const supabase = await createAuthClient();
  await supabase.from("projects").delete().eq("id", String(fd.get("id")));
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
