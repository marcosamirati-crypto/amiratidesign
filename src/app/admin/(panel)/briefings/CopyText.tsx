"use client";

import { useState } from "react";

export default function CopyText({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {}
      }}
      className="btn rounded-full border border-line px-5 py-2.5 text-sm font-medium"
    >
      {done ? "Copiado" : "Copiar respostas"}
    </button>
  );
}
