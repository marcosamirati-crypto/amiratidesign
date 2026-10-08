// Preparo do print no navegador: valida, reduz e reenvia como JPEG.
// Ao redesenhar no canvas, os metadados (EXIF: local, data, aparelho) ficam para trás: só os pixels seguem.

import type { ElleErrorCode } from "./types";

export class ImageError extends Error {
  constructor(public code: ElleErrorCode) {
    super(code);
    this.name = "ImageError";
  }
}

export interface PreparedImage {
  blob: Blob;
  /** URL local só para a prévia. Libere com URL.revokeObjectURL. */
  url: string;
  width: number;
  height: number;
}

/** Aceita JPG, PNG, WEBP e HEIC/HEIF (HEIC só abre onde o navegador sabe decodificar, como o Safari). */
export const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

const MAX_INPUT_BYTES = 30 * 1024 * 1024;
const MAX_LONG_SIDE = 2400;
const MAX_PIXELS = 5_000_000;
const MAX_OUTPUT_BYTES = 3.6 * 1024 * 1024; // a Vercel recusa corpos acima de ~4,5 MB

const isHeic = (f: File) => /hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);
const isKnown = (f: File) => /^image\/(jpeg|png|webp)$/i.test(f.type) || isHeic(f) || (!f.type && /\.(jpe?g|png|webp)$/i.test(f.name));

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  try {
    const bmp = await createImageBitmap(file);
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  } catch {
    // Alguns navegadores só decodificam via <img>.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
    } catch {
      URL.revokeObjectURL(url);
      throw new ImageError(isHeic(file) ? "unsupported" : "unreadable");
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageError("unreadable"))), "image/jpeg", quality));
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!isKnown(file)) throw new ImageError("unsupported");
  if (file.size > MAX_INPUT_BYTES) throw new ImageError("too_large");

  const dec = await decode(file);
  try {
    const { width: w, height: h } = dec;
    // Print de comentário precisa ter texto legível: abaixo disso nem a melhor leitura salva.
    if (Math.min(w, h) < 280 || w * h < 120_000) throw new ImageError("low_res");

    let scale = Math.min(1, MAX_LONG_SIDE / Math.max(w, h), Math.sqrt(MAX_PIXELS / (w * h)));
    let quality = 0.88;
    let blob: Blob | null = null;
    let cw = w;
    let ch = h;

    for (let attempt = 0; attempt < 4; attempt++) {
      cw = Math.max(1, Math.round(w * scale));
      ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new ImageError("unreadable");
      ctx.fillStyle = "#fff"; // PNG com transparência vira fundo branco
      ctx.fillRect(0, 0, cw, ch);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(dec.source, 0, 0, cw, ch);
      blob = await toBlob(canvas, quality);
      if (blob.size <= MAX_OUTPUT_BYTES) break;
      quality = Math.max(0.7, quality - 0.08);
      scale *= 0.85;
    }
    if (!blob || blob.size > MAX_OUTPUT_BYTES) throw new ImageError("too_large");
    return { blob, url: URL.createObjectURL(blob), width: cw, height: ch };
  } finally {
    dec.close();
  }
}
