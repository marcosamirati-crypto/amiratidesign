"use client";

import { elleCopy } from "@/content/elle/copy";
import type { ElleErrorCode } from "@/lib/elle/types";

/** Erro dito de forma humana, sempre com saída: tentar de novo ou escolher outro print. */
export default function ErrorState({
  code,
  onRetry,
  onOther,
}: {
  code: ElleErrorCode;
  onRetry: () => void;
  onOther: () => void;
}) {
  const e = elleCopy.errors[code];
  const msg = typeof e === "string" ? { title: e, body: "" } : e;
  return (
    <div className="elle-error" role="alert">
      <h1 className="elle-error-title">{msg.title}</h1>
      <p className="elle-error-body">{msg.body}</p>
      <div className="elle-actions">
        <button type="button" className="elle-btn elle-btn--primary" onClick={onRetry} autoFocus>
          {elleCopy.errors.retry}
        </button>
        <button type="button" className="elle-btn elle-btn--text" onClick={onOther}>
          {elleCopy.errors.other}
        </button>
      </div>
    </div>
  );
}
