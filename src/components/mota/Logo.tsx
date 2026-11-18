// Logotipo MotaSat (vetores oficiais do sistema de marca). Cores por prop: "mono" (tudo em currentColor) ou "neg" (SAT e janela do céu em vermelho).
type Props = { variant?: "mono" | "neg"; className?: string; title?: string; symbol?: boolean; wordmark?: boolean };

const WORD = ['M51.36,18.42v18.24h-7.44v-18.24q0-3.24-1.38-5.7t-3.84-3.84-5.7-1.38H7.44v29.16H0V7.5q0-3.24,1.98-5.16Q3.96.42,7.26.42h25.74q5.4,0,9.54,2.31,4.14,2.31,6.48,6.36Q51.36,13.14,51.36,18.42ZM21.84,3.42h7.44v33.24h-7.44V3.42Z', 'M75.96,37.32q-5.52,0-9.75-2.37t-6.63-6.6-2.4-9.69,2.4-9.72,6.63-6.57,9.75-2.37,9.75,2.37,6.63,6.57,2.4,9.72-2.4,9.69-6.63,6.6T75.96,37.32ZM75.96,30.24q3.36,0,5.91-1.47,2.55-1.47,3.99-4.08,1.44-2.61,1.44-6.03,0-3.36-1.44-5.97-1.44-2.61-3.99-4.11-2.55-1.5-5.91-1.5-3.3,0-5.88,1.5-2.58,1.5-4.02,4.11-1.44,2.61-1.44,5.97,0,3.42,1.44,6.03,1.44,2.61,4.02,4.08Q72.66,30.24,75.96,30.24Z', 'M127.44.66v7.08h-12v28.92h-7.44V7.74h-12V.66H127.44Z', 'M141.96,0q1.2,0,2.31.42t1.98,1.26,1.41,2.04l15.24,32.94h-8.28l-13.08-29.76h.84l-13.08,29.76h-8.28l15.24-32.94q.54-1.2,1.41-2.04.87-.84,1.98-1.26Q140.76,0,141.96,0ZM130.92,22.44h22.5v7.08h-22.5V22.44Z', 'M186.84,15.06q3.24,0,5.7,1.38t3.87,3.81,1.41,5.61-1.41,5.61-3.87,3.81-5.7,1.38h-22.44v-7.08h22.44q1.56,0,2.55-1.05.99-1.05.99-2.67,0-1.62-.99-2.67-.99-1.05-2.55-1.05h-11.52q-3.18,0-5.67-1.38-2.49-1.38-3.87-3.81-1.38-2.43-1.38-5.61,0-3.18,1.38-5.58,1.38-2.4,3.87-3.75,2.49-1.35,5.67-1.35h18.18v7.08h-18.18q-1.5,0-2.49,1.02-.99,1.02-.99,2.58,0,1.62.99,2.67.99,1.05,2.49,1.05H186.84Z', 'M220.26,0q1.2,0,2.31.42t1.98,1.26,1.41,2.04l15.24,32.94h-8.28l-13.08-29.76h.84l-13.08,29.76h-8.28l15.24-32.94q.54-1.2,1.41-2.04.87-.84,1.98-1.26Q219.06,0,220.26,0ZM209.22,22.44h22.5v7.08h-22.5V22.44Z', 'M266.22.66v7.08h-12v28.92h-7.44V7.74h-12V.66H266.22Z'] as const;
const SYM = ['M0 40 V8 Q0 0 8 0 H38 Q55 0 55 17 V40 Z M8 32 H47 V19 Q47 8 36 8 H8 Z', 'M55 40 V17 Q55 0 72 0 H94 Q102 0 102 8 V40 Z M63 32 H94 V8 H74 Q63 8 63 19 Z'] as const;

export default function Logo({ variant = "mono", className, title = "MotaSat", symbol = true, wordmark = true }: Props) {
  const accent = variant === "neg" ? "#CB2957" : "currentColor";
  // símbolo 102×40 + respiro 22 + palavra (266.22×37.32 escalada para altura 28)
  const k = 28 / 37.32;
  const wx = symbol ? 124 : 0;
  const width = (symbol ? 102 : 0) + (symbol && wordmark ? 22 : 0) + (wordmark ? 266.22 * k : 0);
  return (
    <svg className={className} viewBox={`0 0 ${width.toFixed(2)} 40`} role="img" aria-label={title}>
      {symbol && (
        <g>
          <path fill="currentColor" fillRule="evenodd" d={SYM[0]} />
          <path fill={accent} fillRule="evenodd" d={SYM[1]} />
        </g>
      )}
      {wordmark && (
        <g transform={`translate(${symbol ? wx : 0} 6) scale(${k})`}>
          {WORD.map((d, i) => (
            <path key={i} fill={i >= 4 ? accent : "currentColor"} d={d} />
          ))}
        </g>
      )}
    </svg>
  );
}
