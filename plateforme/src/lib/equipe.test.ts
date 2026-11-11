/* Tests du module équipe — sans framework : npx tsx src/lib/equipe.test.ts */
import assert from "node:assert/strict";
import {
  tempsDeJeu, statsJoueurs, ceWeekend, nettoyerReseaux, estConvoque,
  absencesDeSuite, dateParis, minutesRecentes, momentEvenement, resumeSemaine, semaineParis,
  type Evenement, type Membre, type Presence,
} from "./equipe";

let ok = 0;
const test = (nom: string, f: () => void) => {
  try { f(); ok++; console.log(`ok  ${nom}`); }
  catch (e) { console.error(`ÉCHEC  ${nom}`); throw e; }
};

const ev = (id: string, type: Evenement["type"], debut: string, extra: Partial<Evenement> = {}): Evenement => ({
  id, type, titre: null, debut, lieu: null, adversaire: null, domicile: null, score_pour: null, score_contre: null, resume: null, ...extra,
});
const joueur = (id: string, nom: string): Membre => ({ id, user_id: null, nom, role: "joueur", poste: null, numero: null });
const pr = (evenement_id: string, membre_id: string, present: boolean | null, extra: Partial<Presence> = {}): Presence => ({
  evenement_id, membre_id, reponse: null, present, minutes: null, ...extra,
});

/* ─── Semaine et changement d'heure ─── */
test("semaine normale : lundi 00:00 → lundi suivant 00:00, heure de Paris (hiver)", () => {
  const s = semaineParis(new Date("2026-11-11T10:00:00Z")); // mercredi
  assert.equal(s.lundi, "2026-11-09");
  assert.equal(s.dimanche, "2026-11-15");
  assert.equal(s.debut, "2026-11-08T23:00:00.000Z");
  assert.equal(s.fin, "2026-11-15T23:00:00.000Z");
});

test("semaine du passage à l'heure d'hiver (dim. 25 oct. 2026) : 169 h", () => {
  // Dimanche 25 octobre 23:59 à Paris = 22:59 UTC : on est encore dans la semaine du 19.
  const s = semaineParis(new Date("2026-10-25T22:59:00Z"));
  assert.equal(s.lundi, "2026-10-19");
  assert.equal(s.dimanche, "2026-10-25");
  assert.equal(s.debut, "2026-10-18T22:00:00.000Z"); // lundi 00:00 CEST
  assert.equal(s.fin, "2026-10-25T23:00:00.000Z"); // lundi 00:00 CET
  assert.equal((Date.parse(s.fin) - Date.parse(s.debut)) / 36e5, 169);
  // Lundi 26 octobre 00:10 à Paris = dimanche 23:10 UTC : nouvelle semaine (un calcul en UTC se tromperait)
  assert.equal(semaineParis(new Date("2026-10-25T23:10:00Z")).lundi, "2026-10-26");
  assert.equal(dateParis(Date.parse("2026-10-25T23:10:00Z")), "2026-10-26");
});

test("semaine du passage à l'heure d'été (dim. 29 mars 2026) : 167 h", () => {
  const s = semaineParis(new Date("2026-03-29T12:00:00Z"));
  assert.equal(s.lundi, "2026-03-23");
  assert.equal((Date.parse(s.fin) - Date.parse(s.debut)) / 36e5, 167);
});

test("résumé : événements en bordure de la semaine du changement d'heure", () => {
  const now = new Date("2026-10-25T22:00:00Z"); // dimanche 23:00 à Paris
  const a = joueur("a", "Ana"), b = joueur("b", "Bob");
  const evts = [
    ev("avant", "entrainement", "2026-10-18T21:30:00Z"), // dimanche 18 23:30 Paris : semaine précédente
    ev("lun", "entrainement", "2026-10-18T22:30:00Z"), // lundi 19 00:30 Paris : dans la semaine
    ev("dim", "match", "2026-10-25T13:00:00Z", { adversaire: "X", score_pour: 3, score_contre: 1 }), // dimanche 14:00 CET
    ev("tard", "entrainement", "2026-10-25T22:30:00Z"), // dimanche 23:30 Paris : dans la semaine, pas encore fait
    ev("apres", "entrainement", "2026-10-25T23:30:00Z"), // lundi 26 00:30 Paris : semaine suivante
  ];
  const presences = [pr("lun", "a", true), pr("lun", "b", false)];
  const r = resumeSemaine(evts, [a, b], presences, now);
  assert.equal(r.entrainementsPrevus, 2);
  assert.equal(r.entrainementsFaits, 1);
  assert.equal(r.taux, 50);
  assert.deepEqual(r.matchs.map((e) => e.id), ["dim"]);
  assert.equal(r.prochain?.id, "tard");
  assert.deepEqual(r.sansReponse.map((m) => m.id), ["a", "b"]);
});

/* ─── Appel non fait ─── */
test("appel non fait : pas de taux, compté à faire, ne casse pas les absences de suite", () => {
  const now = new Date("2026-11-13T20:00:00Z"); // vendredi
  const a = joueur("a", "Ana"), b = joueur("b", "Bob");
  const evts = [
    ev("e1", "entrainement", "2026-11-03T18:00:00Z"),
    ev("e2", "entrainement", "2026-11-05T18:00:00Z"),
    ev("e3", "entrainement", "2026-11-10T18:00:00Z"), // cette semaine, appel fait
    ev("e4", "entrainement", "2026-11-12T18:00:00Z"), // cette semaine, appel PAS fait (réponses seulement)
    ev("e5", "entrainement", "2026-11-17T18:00:00Z"),
  ];
  const presences = [
    pr("e1", "a", true), pr("e1", "b", false),
    pr("e2", "a", true), pr("e2", "b", false),
    pr("e3", "a", true), pr("e3", "b", false),
    pr("e4", "a", null, { reponse: "oui" }), pr("e4", "b", null, { reponse: "non" }),
    pr("e5", "a", null, { reponse: "oui" }),
  ];
  const r = resumeSemaine(evts, [a, b], presences, now);
  assert.equal(r.entrainementsPrevus, 2);
  assert.equal(r.entrainementsFaits, 2);
  assert.equal(r.appelsAFaire, 1);
  assert.equal(r.taux, 50); // seul e3 compte
  assert.deepEqual(r.aRelancer.map((x) => [x.membre.id, x.absences]), [["b", 3]]);
  assert.deepEqual(r.sansReponse.map((m) => m.id), ["b"]);

  // Aucun appel fait de la semaine : taux null, et personne à relancer sur la seule base des réponses
  const sansAppel = resumeSemaine(evts, [a, b], presences.filter((p) => p.present === null), now);
  assert.equal(sansAppel.taux, null);
  assert.equal(sansAppel.appelsAFaire, 2);
  assert.equal(sansAppel.aRelancer.length, 0);
});

test("absences de suite : s'arrêtent à la dernière présence, ignorent les lignes non notées", () => {
  const now = new Date("2026-11-30T12:00:00Z");
  const evts = ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"].map((d, i) => ev(`e${i}`, "entrainement", `${d}T18:00:00Z`));
  const presences = [
    pr("e0", "a", false), pr("e0", "z", true),
    pr("e1", "a", true), pr("e1", "z", true),
    pr("e2", "a", false), pr("e2", "z", true),
    /* e3 : pas de ligne pour a (ajouté après ?) */ pr("e3", "z", true),
  ];
  assert.equal(absencesDeSuite("a", evts, presences, now), 1);
  assert.equal(absencesDeSuite("z", evts, presences, now), 0);
});

/* ─── Équipe sans joueur ─── */
test("équipe sans joueur : résumé vide, sans erreur", () => {
  const now = new Date("2026-11-11T10:00:00Z");
  const evts = [
    ev("e1", "entrainement", "2026-11-09T18:00:00Z"),
    ev("m1", "match", "2026-11-10T14:00:00Z", { score_pour: 1, score_contre: 1 }),
    ev("e2", "entrainement", "2026-11-12T18:00:00Z"),
  ];
  const r = resumeSemaine(evts, [], [pr("e1", "coach", true)], now);
  assert.equal(r.entrainementsFaits, 1);
  assert.equal(r.entrainementsPrevus, 2);
  assert.equal(r.taux, null); // la ligne d'un non-joueur ne compte pas
  assert.equal(r.matchs.length, 1);
  assert.deepEqual(r.aRelancer, []);
  assert.deepEqual(r.sansReponse, []);
  assert.deepEqual(minutesRecentes([], evts, [], now), { matchs: 1, lignes: [] });
  assert.deepEqual(resumeSemaine([], [], [], now).prochain, null);
});

/* ─── Minutes des 7 derniers jours ─── */
test("minutes récentes : matchs passés des 7 derniers jours seulement, tri décroissant", () => {
  const now = new Date("2026-11-11T10:00:00Z");
  const a = joueur("a", "Ana"), b = joueur("b", "Bob"), c = joueur("c", "Cid");
  const evts = [
    ev("vieux", "match", "2026-11-03T14:00:00Z"), // 8 jours avant : exclu
    ev("m1", "match", "2026-11-05T14:00:00Z"),
    ev("m2", "match", "2026-11-09T14:00:00Z"),
    ev("ent", "entrainement", "2026-11-10T18:00:00Z"),
    ev("futur", "match", "2026-11-14T14:00:00Z"),
  ];
  const presences = [
    pr("vieux", "a", true, { minutes: 90 }),
    pr("m1", "a", true, { minutes: 90 }), pr("m1", "b", true, { minutes: 30 }),
    pr("m2", "a", true, { minutes: 60 }), pr("m2", "b", true, { minutes: 90 }), pr("m2", "c", false),
    pr("futur", "c", null, { reponse: "oui", minutes: 90 }),
  ];
  const r = minutesRecentes([a, b, c], evts, presences, now);
  assert.equal(r.matchs, 2);
  assert.deepEqual(r.lignes.map((l) => [l.membre.id, l.minutes, l.matchs]), [["a", 150, 2], ["b", 120, 2]]);
});

test("moment de l'événement : ce soir, aujourd'hui, plus tard (heure de Paris)", () => {
  const now = new Date("2026-11-11T10:00:00Z");
  assert.equal(momentEvenement(ev("x", "entrainement", "2026-11-11T18:00:00Z"), now), "ceSoir"); // 19:00 Paris
  assert.equal(momentEvenement(ev("x", "match", "2026-11-11T14:00:00Z"), now), "aujourdhui"); // 15:00 Paris
  assert.equal(momentEvenement(ev("x", "match", "2026-11-11T23:30:00Z"), now), "plusTard"); // 00:30 le 12 à Paris
});

console.log(`\n${ok} tests passés`);

/* ─── Temps de jeu et stats ─── */
{
  const f = (type: "but" | "jaune" | "rouge" | "remplacement", m: string, m2: string | null, minute: number | null) => ({ id: type + m + minute, evenement_id: "e", type, membre_id: m, membre2_id: m2, minute });
  const t = tempsDeJeu(["a", "b", "c"], [f("remplacement", "a", "d", 60), f("rouge", "b", null, 75), f("remplacement", "d", "e", 85)], 90);
  assert.deepEqual(t, { a: 60, b: 75, c: 90, d: 25, e: 5 });
  const s = statsJoueurs([f("but", "a", "b", 10), f("but", "a", null, 20), f("jaune", "b", null, 30)]);
  assert.deepEqual(s.a, { buts: 2, passes: 0, jaunes: 0, rouges: 0 });
  assert.deepEqual(s.b, { buts: 0, passes: 1, jaunes: 1, rouges: 0 });
  assert.deepEqual(nettoyerReseaux({ instagram: "https://instagram.com/club", facebook: "javascript:alert(1)", site: "http://x.fr" }), { instagram: "https://instagram.com/club" });
  assert.equal(estConvoque({ convoques: null }, "x"), true);
  assert.equal(estConvoque({ convoques: ["y"] }, "x"), false);
  console.log("ok temps de jeu, stats, réseaux, convocation");
}
{
  // mercredi 11 nov. 2026 12:00 Paris
  const now = Date.parse("2026-11-11T11:00:00Z");
  const ev = (id: string, iso: string) => ({ id, type: "match", titre: null, debut: iso, lieu: null, adversaire: null, domicile: null, score_pour: null, score_contre: null, resume: null }) as Evenement;
  const r = ceWeekend([ev("jeu", "2026-11-12T18:00:00Z"), ev("sam", "2026-11-14T14:00:00Z"), ev("dim", "2026-11-15T09:00:00Z"), ev("lun", "2026-11-16T18:00:00Z")], now);
  assert.deepEqual(r.map((e) => e.id), ["sam", "dim"]);
  console.log("ok ce week-end : samedi et dimanche seulement");
}
