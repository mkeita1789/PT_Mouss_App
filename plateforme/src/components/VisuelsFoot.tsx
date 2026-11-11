/* Visuels de Baara Foot, dessinés (pas de photos de personnes) :
   terrain vu du dessus, projecteurs de stade, vestiaire aux maillots du club.
   Ils prennent les couleurs du club via --club-1 / --club-2 / --gold. */

/** Lignes d'un terrain vu du dessus (filigrane) */
export function Terrain({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`visuel-terrain ${className}`} style={style} viewBox="0 0 105 68" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <pattern id="bandes" width="21" height="68" patternUnits="userSpaceOnUse">
          <rect width="10.5" height="68" fill="currentColor" opacity="0.035" />
        </pattern>
      </defs>
      <rect width="105" height="68" fill="url(#bandes)" />
      <g fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.5">
        <rect x="2" y="2" width="101" height="64" />
        <path d="M52.5 2v64" />
        <circle cx="52.5" cy="34" r="9.15" />
        <rect x="2" y="13.84" width="16.5" height="40.32" />
        <rect x="86.5" y="13.84" width="16.5" height="40.32" />
        <rect x="2" y="24.84" width="5.5" height="18.32" />
        <rect x="97.5" y="24.84" width="5.5" height="18.32" />
        <path d="M18.5 26.7a9.15 9.15 0 0 1 0 14.6M86.5 26.7a9.15 9.15 0 0 0 0 14.6" />
      </g>
      <g fill="currentColor" opacity="0.6">
        <circle cx="52.5" cy="34" r="0.5" />
        <circle cx="13" cy="34" r="0.4" />
        <circle cx="92" cy="34" r="0.4" />
      </g>
    </svg>
  );
}

/** Deux pylônes de projecteurs et leurs faisceaux, au-dessus d'une tribune */
export function Projecteurs({ className = "", tribune = true }: { className?: string; tribune?: boolean }) {
  const pylone = (x: number, sens: 1 | -1) => (
    <g key={x}>
      <path d={`M${x} 40 L${x - 5 * sens} 240`} stroke="currentColor" strokeWidth="2.2" opacity="0.35" />
      <rect x={x - 16} y="22" width="32" height="18" rx="2" fill="currentColor" opacity="0.5" />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={x - 11 + i * 7.3} cy="31" r="2.6" fill="#fff" opacity="0.95" />)}
      <path d={`M${x - 14} 40 L${x + 150 * sens - 60} 260 L${x + 150 * sens + 60} 260 L${x + 14} 40Z`} fill="url(#faisceau)" />
    </g>
  );
  return (
    <svg className={`visuel-projecteurs ${className}`} viewBox="0 0 400 260" preserveAspectRatio="xMidYMin slice" aria-hidden>
      <defs>
        <linearGradient id="faisceau" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {pylone(60, 1)}
      {pylone(340, -1)}
      {/* tribune : rangées de sièges aux couleurs du club */}
      {tribune && <g opacity="0.55">
        {[0, 1, 2, 3].map((r) => (
          <rect key={r} x={-10} y={196 + r * 12} width="420" height="7" rx="2" fill={r % 2 ? "var(--club-2, currentColor)" : "var(--club-1, currentColor)"} opacity={0.35 + r * 0.1} />
        ))}
      </g>}
    </svg>
  );
}

/** Vestiaire : patères et maillots numérotés aux couleurs du club */
export function Vestiaire({ numeros = [7, 10, 9, 4, 1], className = "" }: { numeros?: number[]; className?: string }) {
  const L = 64;
  return (
    <svg className={`visuel-vestiaire ${className}`} viewBox={`0 0 ${numeros.length * L} 120`} aria-hidden>
      <rect x="0" y="6" width={numeros.length * L} height="5" rx="2" fill="currentColor" opacity="0.25" />
      {numeros.map((n, i) => {
        const x = i * L + L / 2;
        return (
          <g key={i} transform={`translate(${x} 0)`}>
            <path d="M0 9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path
              d="M-9 20 L-22 27 L-27 44 L-18 47 L-15 39 L-15 104 L15 104 L15 39 L18 47 L27 44 L22 27 L9 20 Q0 28 -9 20Z"
              fill={i % 2 ? "var(--club-2, var(--gold))" : "var(--club-1, var(--gold))"}
              stroke="rgb(255 255 255 / 0.18)" strokeWidth="1"
            />
            <path d="M-15 39 L15 39" stroke="rgb(0 0 0 / 0.18)" strokeWidth="1" />
            <text x="0" y="78" textAnchor="middle" fontFamily="var(--font-oswald)" fontWeight="600" fontSize="26"
              fill={i % 2 ? "var(--club-1, #111)" : "var(--club-2, #fff)"}>{n}</text>
          </g>
        );
      })}
    </svg>
  );
}
