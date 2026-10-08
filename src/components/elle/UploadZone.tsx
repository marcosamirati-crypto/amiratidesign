"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACCEPT_ATTR } from "@/lib/elle/image";
import { elleCopy } from "@/content/elle/copy";

/**
 * Todas as formas de entrar com um print: escolher no aparelho, câmera do celular,
 * arrastar e soltar (desktop) e colar (Ctrl+V / Cmd+V). `enabled` liga e desliga tudo.
 */
export function useUploadIntake({ enabled, onFile }: { enabled: boolean; onFile: (file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  const openPicker = useCallback(() => fileRef.current?.click(), []);
  const openCamera = useCallback(() => camRef.current?.click(), []);

  useEffect(() => {
    if (!enabled) {
      setDragging(false);
      return;
    }
    let depth = 0;
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");

    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFileRef.current(file);
    };
    const paste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(input|textarea)$/i.test(target.tagName)) return;
      const item = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (item) {
        e.preventDefault();
        onFileRef.current(item);
      }
    };

    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    window.addEventListener("paste", paste);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
      window.removeEventListener("paste", paste);
    };
  }, [enabled]);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (file) onFile(file);
  };

  const inputs = (
    <>
      <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="elle-sr" tabIndex={-1} aria-hidden="true" onChange={change} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="elle-sr" tabIndex={-1} aria-hidden="true" onChange={change} />
    </>
  );

  return { inputs, openPicker, openCamera, dragging };
}

/** Véu que aparece enquanto um arquivo é arrastado sobre a janela. */
export function DropVeil({ show }: { show: boolean }) {
  return (
    <div className="elle-veil" data-show={show ? "" : undefined} aria-hidden={!show}>
      <p>{elleCopy.home.drop}</p>
    </div>
  );
}
