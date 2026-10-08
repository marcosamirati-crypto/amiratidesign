import { elleCopy } from "@/content/elle/copy";
import type { FactStatus } from "@/lib/elle/types";

/**
 * A confiança de cada fato é desenhada como fase do orbe, não como etiqueta colorida:
 * cheio = confirmado, metade = provável, anel = não confirmado, anel cortado = contestado.
 * O nome por extenso sempre acompanha o desenho (nada depende só de forma ou cor).
 */
export function StatusGlyph({ status, size = 16 }: { status: FactStatus; size?: number }) {
  const c = size / 2;
  const r = c - 1.25;
  return (
    <svg className="elle-glyph" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" data-status={status}>
      {status === "confirmado" && <circle cx={c} cy={c} r={r} fill="currentColor" />}
      {status === "provavel" && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d={`M${c} ${c - r} A${r} ${r} 0 0 0 ${c} ${c + r} Z`} fill="currentColor" />
        </>
      )}
      {status === "nao_confirmado" && <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2.2 2.2" />}
      {status === "contestado" && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d={`M${c - r * 0.7} ${c + r * 0.7} L${c + r * 0.7} ${c - r * 0.7}`} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function StatusMark({ status }: { status: FactStatus }) {
  return (
    <span className="elle-status" data-status={status} title={elleCopy.statusHelp[status]}>
      <StatusGlyph status={status} />
      <span>{elleCopy.status[status]}</span>
    </span>
  );
}
