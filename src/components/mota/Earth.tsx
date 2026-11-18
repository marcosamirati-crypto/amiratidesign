// Curvatura da Terra desenhada em SVG, para a abertura (enquanto a foto definitiva não chega).
// Só preto, cinzas, branco e um fio do vermelho da marca na atmosfera. Duas composições: larga e alta (celular).

type V = { w: number; h: number; R: number; lift: number; sun: number; id: string; className: string };

function Limb({ w, h, R, lift, sun, id, className }: V) {
  const cx = w / 2;
  const cy = h + R - lift; // topo da Terra fica `lift` px acima da base
  const top = cy - R;
  const sx = w * sun;
  const sy = cy - Math.sqrt(R * R - (sx - cx) ** 2);
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-lit`} gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={top + lift * 0.9}>
          <stop offset="0" stopColor="#C8C9CE" stopOpacity="0.2" />
          <stop offset="0.18" stopColor="#777980" stopOpacity="0.07" />
          <stop offset="1" stopColor="#08090D" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.15" />
          <stop offset={Math.max(0.05, sun - 0.25)} stopColor="#fff" stopOpacity="0.75" />
          <stop offset={sun} stopColor="#fff" stopOpacity="1" />
          <stop offset={Math.min(0.95, sun + 0.25)} stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
          <rect width={w} height={h} fill={`url(#${id}-fade)`} />
        </mask>
        <radialGradient id={`${id}-sun`} cx={sx} cy={sy} r={w * 0.42} gradientUnits="userSpaceOnUse" gradientTransform={`translate(${sx} ${sy}) scale(1 0.09) translate(${-sx} ${-sy})`}>
          <stop offset="0" stopColor="#F4F4F5" stopOpacity="0.95" />
          <stop offset="0.12" stopColor="#F4F4F5" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#C8C9CE" stopOpacity="0.08" />
          <stop offset="1" stopColor="#C8C9CE" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx={sx} cy={sy} r={w * 0.3} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F4F4F5" stopOpacity="0.16" />
          <stop offset="1" stopColor="#F4F4F5" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-b1`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={w / 110} />
        </filter>
        <filter id={`${id}-b2`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>

      <g className="e-body">
        <circle cx={cx} cy={cy} r={R} fill="#0A0B0F" />
        <circle cx={cx} cy={cy} r={R} fill={`url(#${id}-lit)`} />
      </g>
      <g className="e-atmo" mask={`url(#${id}-m)`} fill="none">
        <circle cx={cx} cy={cy} r={R + w / 160} stroke="#C8C9CE" strokeOpacity="0.32" strokeWidth={w / 55} filter={`url(#${id}-b1)`} />
        <circle cx={cx} cy={cy} r={R + 2.2} stroke="#CB2957" strokeOpacity="0.7" strokeWidth="1.6" filter={`url(#${id}-b2)`} />
        <circle cx={cx} cy={cy} r={R} stroke="#F4F4F5" strokeOpacity="0.9" strokeWidth="1.4" filter={`url(#${id}-b2)`} />
      </g>
      <g className="e-sun">
        <rect width={w} height={h} fill={`url(#${id}-halo)`} />
        <rect width={w} height={h} fill={`url(#${id}-sun)`} />
      </g>
    </svg>
  );
}

export default function Earth() {
  return (
    <>
      <Limb id="ew" className="mm-earth mm-earth--wide" w={1600} h={1000} R={1750} lift={300} sun={0.64} />
      <Limb id="et" className="mm-earth mm-earth--tall" w={800} h={1400} R={980} lift={430} sun={0.66} />
    </>
  );
}
