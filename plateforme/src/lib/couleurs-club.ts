/* Ambiance de Baara Foot calculée à partir des couleurs du club.
   L'accent (boutons, liens) doit rester lisible sur fond sombre : si la couleur principale
   est trop foncée (marine, noir…), on prend la seconde, sinon on l'éclaircit. */
type RVB = [number, number, number];
const HEX = /^#[0-9a-f]{6}$/i;
const rvb = (h: string): RVB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RVB;
const hex = (c: RVB) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (a: RVB, b: RVB, t: number): RVB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RVB;
const lum = (c: RVB) => {
  const l = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
};
const contraste = (a: RVB, b: RVB) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const NOIR: RVB = [7, 7, 8];
const BLANC: RVB = [255, 255, 255];

export function accentClub(c1?: string | null, c2?: string | null): RVB | null {
  const cs = [c1, c2].filter((c): c is string => !!c && HEX.test(c)).map(rvb);
  if (!cs.length) return null;
  const lisible = cs.find((c) => contraste(c, NOIR) >= 3);
  if (lisible) return lisible;
  let c = cs[0];
  for (let i = 0; i < 8 && contraste(c, NOIR) < 3; i++) c = mix(c, BLANC, 0.2);
  return c;
}

/** Variables CSS de l'ambiance du club, ou null (ambiance pelouse par défaut) */
export function paletteClub(c1?: string | null, c2?: string | null): string | null {
  const a = accentClub(c1, c2);
  if (!a) return null;
  const base = c1 && HEX.test(c1) ? rvb(c1) : a;
  const t = (fond: string, p: number) => hex(mix(rvb(fond), base, p));
  const rouge = a[0] > 170 && a[1] < 120 && a[2] < 120;
  const v: Record<string, string> = {
    "--a": a.map(Math.round).join(" "),
    "--gold": hex(a), "--gold-deep": hex(mix(a, NOIR, 0.3)), "--gold-light": hex(mix(a, BLANC, 0.25)),
    "--gold-text": hex(mix(a, BLANC, 0.45)), "--gold-ink": lum(a) > 0.36 ? "#0b0b0c" : "#ffffff",
    "--gold-soft": `rgb(${a.map(Math.round).join(" ")} / 0.12)`, "--gold-line": `rgb(${a.map(Math.round).join(" ")} / 0.36)`,
    "--bg": t("#070708", 0.05), "--surface": t("#111114", 0.07), "--surface-2": t("#18181c", 0.09), "--surface-3": t("#202026", 0.11),
    "--hero-1": t("#0e0e10", 0.26), "--hero-2": t("#0a0a0b", 0.1), "--auth-bg": t("#0a0a0b", 0.12),
    "--club-1": hex(base), "--club-2": c2 && HEX.test(c2) ? c2 : hex(a),
  };
  if (rouge) Object.assign(v, { "--ko": "#ff9f43", "--ko-soft": "rgba(255, 159, 67, 0.1)" });
  return `:root[data-theme]{${Object.entries(v).map(([k, x]) => `${k}:${x}`).join(";")}}`;
}
