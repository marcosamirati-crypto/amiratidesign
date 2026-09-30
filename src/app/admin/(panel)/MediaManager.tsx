"use client";

import { useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Props = {
  initialImages: string[];
  initialCover: string | null;
  initialHighlights: string[];
  initialJoined: string[];
  onBusyChange: (busy: boolean) => void;
};

/**
 * Gerencia capa + imagens do projeto. Os arquivos vão direto do navegador para o Supabase Storage
 * (sem passar pela Vercel, que limita o envio a ~4,5 MB). O formulário recebe só as URLs.
 */
export default function MediaManager({ initialImages, initialCover, initialHighlights, initialJoined, onBusyChange }: Props) {
  const [images, setImages] = useState<string[]>(() => {
    // projetos antigos: a capa ficava fora da lista; junta no começo
    if (initialCover && !initialImages.includes(initialCover)) return [initialCover, ...initialImages];
    return initialImages;
  });
  const [cover, setCover] = useState<string | null>(initialCover);
  const [highlights, setHighlights] = useState<string[]>(initialHighlights);
  const [joined, setJoined] = useState<string[]>(initialJoined);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const input = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setError("");
    onBusyChange(true);
    const supabase = createBrowserSupabase();
    const added: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      setStatus(`Enviando ${i + 1} de ${list.length}: ${f.name}`);
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: err } = await supabase.storage.from("projects").upload(path, f, {
        contentType: f.type || undefined,
        cacheControl: "31536000",
      });
      if (err) {
        setError(`Falhou em "${f.name}": ${err.message}`);
        break;
      }
      added.push(supabase.storage.from("projects").getPublicUrl(path).data.publicUrl);
    }
    if (added.length) {
      setImages((prev) => [...prev, ...added]);
      setCover((c) => c ?? added[0]);
    }
    setStatus("");
    onBusyChange(false);
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: -1 | 1) =>
    setImages((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (url: string) => {
    setHighlights((h) => h.filter((u) => u !== url));
    setJoined((j) => j.filter((u) => u !== url));
    setImages((prev) => {
      const next = prev.filter((u) => u !== url);
      if (cover === url) setCover(next[0] ?? null);
      return next;
    });
  };

  const btn = "rounded border border-line px-2 py-1 text-xs hover:border-fg disabled:opacity-30";

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1.5 block text-sm text-muted">
        Imagens (aparecem empilhadas na página, na ordem abaixo)
      </legend>
      <input type="hidden" name="images_json" value={JSON.stringify(images)} />
      <input type="hidden" name="cover_url" value={cover ?? ""} />
      <input type="hidden" name="joined_json" value={JSON.stringify(joined)} />
      <input type="hidden" name="highlights_json" value={JSON.stringify(highlights.filter((u) => images.includes(u)))} />

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.map((u, i) => (
          <li key={u} className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="aspect-video w-full bg-surface-2 object-contain" />
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima">↑</button>
              <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Mover para baixo">↓</button>
              <button
                type="button"
                className={`${btn} ${cover === u ? "!border-accent bg-accent text-on-accent" : ""}`}
                onClick={() => setCover(u)}
              >
                {cover === u ? "Capa" : "Usar como capa"}
              </button>
              <button
                type="button"
                className={`${btn} ${highlights.includes(u) ? "!border-accent bg-accent text-on-accent" : ""}`}
                onClick={() => setHighlights((h) => (h.includes(u) ? h.filter((x) => x !== u) : [...h, u]))}
                title="Aparece no mural de Social Media da home"
              >
                {highlights.includes(u) ? "★ Destaque" : "☆ Destaque"}
              </button>
              {highlights.includes(u) && (
                <button
                  type="button"
                  className={`${btn} ${joined.includes(u) ? "!border-accent bg-accent text-on-accent" : ""}`}
                  onClick={() => setJoined((j) => (j.includes(u) ? j.filter((x) => x !== u) : [...j, u]))}
                  title="Na home, aparece colada ao destaque anterior (trinca contínua)"
                >
                  {joined.includes(u) ? "⛓ Colada" : "⛓ Colar no anterior"}
                </button>
              )}
              <button type="button" className={btn} onClick={() => remove(u)}>Remover</button>
            </div>
          </li>
        ))}
      </ul>

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(e.target.files)}
        className="text-sm"
      />
      {status && <p role="status" className="text-sm text-muted">{status}</p>}
      {error && <p role="alert" className="text-sm text-accent-ink">{error}</p>}
      <p className="text-xs text-muted">
        Até 50 MB por arquivo. A ordem do mural da home segue a ordem desta lista: mova as imagens com ↑ ↓.
        Para uma trinca contínua, marque as três como destaque e use "Colar no anterior" na 2ª e na 3ª.
      </p>
    </fieldset>
  );
}
