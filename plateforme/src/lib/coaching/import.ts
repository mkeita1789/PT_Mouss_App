/* Transfert depuis l'ancienne PWA (localStorage) vers la plateforme.
   Tout ce qui arrive du téléphone est revalidé ici : rien n'est cru sur parole. */
import { parseKg } from "./amrap";
import { buildProgram, CHECKIN_Q, questionsBilan } from "./programme";
import type { Bilan, Categorie, Checkin } from "./types";

export type SeanceImport = {
  realisee_le: string;
  jour_code: string;
  focus: string;
  phase: string | null;
  exercices: { nom: string; categorie: Categorie; charge_kg: number | null; series: number; amrap: number | null; cible: number | null; note: string | null }[];
};

export type ImportNormalise = {
  bilan: { reponses: Bilan; debut: string } | null;
  seances: SeanceImport[];
  checkins: (Checkin & { jour: string })[];
  ignores: number;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const entier = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
};
const MAX_SEANCES = 500;
const DEBUT_MIN = Date.UTC(2023, 0, 1);

/** Date d'une séance PWA : `iso` si présent, sinon "jj/mm/aaaa" (anciennes versions) */
function dateSeance(h: Record<string, unknown>, now: number): string | null {
  let t = NaN;
  if (typeof h.iso === "string") t = Date.parse(h.iso);
  if (isNaN(t) && typeof h.date === "string") {
    const m = h.date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) t = Date.UTC(+m[3], +m[2] - 1, +m[1], 12);
  }
  if (isNaN(t) || t < DEBUT_MIN || t > now + 864e5) return null;
  return new Date(t).toISOString();
}

export function normaliserImport(brut: unknown, now: number = Date.now()): ImportNormalise {
  const out: ImportNormalise = { bilan: null, seances: [], checkins: [], ignores: 0 };
  if (!brut || typeof brut !== "object") return out;
  const p = brut as Record<string, unknown>;

  /* ─── Bilan : chaque réponse doit faire partie des choix proposés ─── */
  const prof = p.profile && typeof p.profile === "object" ? (p.profile as Record<string, unknown>) : null;
  if (prof) {
    const rep: Partial<Bilan> = {};
    let valide = true;
    for (const q of questionsBilan(prof as Partial<Bilan>)) {
      const v = prof[q.k];
      if (q.type === "text") {
        const t = str(v, 40);
        if (!t) valide = false;
        (rep as Record<string, string>)[q.k] = t;
      } else if (typeof v === "string" && q.o?.includes(v)) {
        (rep as Record<string, string>)[q.k] = v;
      } else valide = false;
    }
    const start = typeof prof.start === "number" ? prof.start : NaN;
    const debut = start >= DEBUT_MIN && start <= now ? new Date(start).toISOString() : new Date(now).toISOString();
    if (valide) out.bilan = { reponses: rep as Bilan, debut };
  }

  /* Catégories de charge connues du programme du client (le nom d'exercice suffit) */
  const cats = new Map<string, Categorie>();
  if (out.bilan) {
    const d0 = Date.parse(out.bilan.debut);
    for (let w = 0; w < 8; w++)
      buildProgram(out.bilan.reponses, out.bilan.debut, new Date(d0 + w * 7 * 864e5 + 36e5)).days.forEach((d) =>
        d.ex.forEach((e) => cats.set(e.n, e.c)),
      );
  }

  /* ─── Séances ─── */
  const histo = Array.isArray(p.history) ? p.history : [];
  const vues = new Set<string>();
  for (const h of histo.slice(-MAX_SEANCES)) {
    if (!h || typeof h !== "object") { out.ignores++; continue; }
    const s = h as Record<string, unknown>;
    const quand = dateSeance(s, now);
    const exs = Array.isArray(s.ex) ? s.ex.slice(0, 20) : [];
    if (!quand || !exs.length || vues.has(quand)) { out.ignores++; continue; }
    vues.add(quand);
    out.seances.push({
      realisee_le: quand,
      jour_code: str(s.day, 40) || "SÉANCE",
      focus: str(s.focus, 80),
      phase: str(s.phase, 40) || null,
      exercices: exs.flatMap((e) => {
        if (!e || typeof e !== "object") return [];
        const x = e as Record<string, unknown>;
        const nom = str(x.n, 80);
        if (!nom) return [];
        const kg = parseKg(typeof x.load === "string" || typeof x.load === "number" ? x.load : null);
        const charge_kg = kg !== null && kg >= 0 && kg <= 1000 ? kg : null;
        return [{
          nom,
          categorie: cats.get(nom) ?? (charge_kg !== null ? "A" : "-"),
          charge_kg,
          series: entier(x.sets, 0, 20) ?? 0,
          amrap: entier(x.amrap, 0, 100),
          cible: entier(x.cible, 1, 100),
          note: str(x.note, 500) || null,
        }];
      }),
    });
  }

  /* ─── Check-ins : clés "AAAA-MM-JJ", valeurs parmi les choix proposés ─── */
  const ci = p.checkins && typeof p.checkins === "object" ? (p.checkins as Record<string, unknown>) : {};
  for (const [jour, v] of Object.entries(ci).slice(-400)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(jour) || !v || typeof v !== "object") continue;
    const c = v as Record<string, unknown>;
    if (CHECKIN_Q.every((q) => typeof c[q.k] === "string" && q.o.includes(c[q.k] as string)))
      out.checkins.push({ jour, sommeil: c.sommeil as string, energie: c.energie as string, corps: c.corps as string });
  }
  return out;
}
