"use client";

import { elleCopy } from "@/content/elle/copy";
import type { PreparedImage } from "@/lib/elle/image";

/** Prévia do print antes de enviar: trocar, cancelar ou investigar. */
export default function ImagePreview({
  image,
  onGo,
  onSwap,
  onCancel,
}: {
  image: PreparedImage;
  onGo: () => void;
  onSwap: () => void;
  onCancel: () => void;
}) {
  const t = elleCopy.preview;
  return (
    <div className="elle-preview">
      <figure className="elle-shot">
        {/* A imagem é local (blob:), então next/image não se aplica. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={t.alt} width={image.width} height={image.height} />
      </figure>
      <div className="elle-actions">
        <button type="button" className="elle-btn elle-btn--primary" onClick={onGo} autoFocus>
          {t.go}
        </button>
        <div className="elle-row">
          <button type="button" className="elle-btn elle-btn--text" onClick={onSwap}>
            {t.swap}
          </button>
          <button type="button" className="elle-btn elle-btn--text" onClick={onCancel}>
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
