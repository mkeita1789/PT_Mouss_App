"use server";

import { revalidatePath } from "next/cache";
import { exigerCoach, getReath, getUtilisateur } from "@/lib/data";
import { notifierCoach } from "@/lib/activite";
import { alerteGenou, JOURS_EN, JOURS_FR } from "@/lib/coaching/reath-lca";
import { IDS_PROGRAMMES, lireProgramme, type IdProgramme } from "@/lib/coaching/programmes-speciaux";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rafraichir = (clientId: string) => { revalidatePath(`/coach/${clientId}`); revalidatePath("/reathletisation"); revalidatePath("/entrainement"); };

/* ─── Client : noter une séance (genou pour le LCA, ressenti d'effort sinon) ─── */
export async function noterSeanceReath(semaine: number, jour: number, valeur: number, gonflement: boolean, note: string): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const reath = await getReath(user.id);
  if (!reath) return { erreur: T.reath.erreur };
  const prog = lireProgramme(reath.programme);
  const s = Math.round(semaine), j = Math.round(jour), v = Math.round(valeur);
  const seance = prog.semaines[s - 1]?.jours[j];
  if (s < 1 || s > Math.min(reath.semaine, prog.semaines.length) || !seance || seance.type === "repos" || seance.info || !(v >= 0 && v <= 10)) return { erreur: T.reath.erreur };

  const supabase = await createClient();
  const { error } = await supabase.from("reath_seances").upsert(
    {
      client_id: user.id, semaine: s, jour: j,
      douleur: prog.genou ? v : null, gonflement: prog.genou ? !!gonflement : false, rpe: prog.genou ? null : v,
      note: String(note ?? "").trim().slice(0, 300) || null, fait_le: new Date().toISOString(),
    },
    { onConflict: "client_id,semaine,jour" },
  );
  if (error) return { erreur: T.reath.erreur };

  /* Le coach est prévenu ; ⚠️ en cas de douleur ou de gonflement au genou */
  const alerte = prog.genou && alerteGenou(v, !!gonflement);
  await notifierCoach(user, "fin", `${prog.id.toUpperCase()} S${s}`.slice(0, 40), (lang) => {
    const R = ui(lang).reath;
    const parts = [R.detailProg(prog.titre[lang], s, (lang === "en" ? JOURS_EN : JOURS_FR)[j]), prog.genou ? R.douleurCourt(v) : R.rpeCourt(v)];
    if (prog.genou && gonflement) parts.push(R.gonfle);
    return (alerte ? "⚠️ " : "") + parts.join(" · ");
  });
  revalidatePath("/reathletisation");
  return {};
}

export async function retirerSeanceReath(semaine: number, jour: number): Promise<void> {
  const user = await getUtilisateur();
  const supabase = await createClient();
  await supabase.from("reath_seances").delete().eq("client_id", user.id).eq("semaine", Math.round(semaine)).eq("jour", Math.round(jour));
  revalidatePath("/reathletisation");
}

/* ─── Coach : attribuer, faire passer les semaines, arrêter ─── */
export async function inscrireReath(clientId: string, formData: FormData): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const id = String(formData.get("programme") ?? "lca") as IdProgramme;
  if (!IDS_PROGRAMMES.includes(id)) return;
  const prog = lireProgramme(id);
  /* Le LCA exige tous les critères d'entrée cochés */
  if (prog.criteresEntree && formData.getAll("critere").length < prog.criteresEntree.fr.length) return;
  const debut = String(formData.get("debut") ?? "");
  const supabase = await createClient();
  /* Nouveau programme : on repart d'une feuille blanche */
  await supabase.from("reath_seances").delete().eq("client_id", clientId);
  await supabase.from("reath").upsert({ client_id: clientId, programme: id, semaine: 1, debut: /^\d{4}-\d{2}-\d{2}$/.test(debut) ? debut : new Date().toISOString().slice(0, 10), maj_le: new Date().toISOString() });
  rafraichir(clientId);
}

export async function changerSemaineReath(clientId: string, semaine: number): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const reath = await getReath(clientId);
  if (!reath) return;
  const n = lireProgramme(reath.programme).semaines.length;
  const s = Math.max(1, Math.min(n + 1, Math.round(semaine)));
  const supabase = await createClient();
  await supabase.from("reath").update({ semaine: s, maj_le: new Date().toISOString() }).eq("client_id", clientId);
  rafraichir(clientId);
}

export async function arreterReath(clientId: string): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const supabase = await createClient();
  await supabase.from("reath").delete().eq("client_id", clientId);
  rafraichir(clientId);
}

export async function enregistrerVma(clientId: string, formData: FormData): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const brut = String(formData.get("vma") ?? "").replace(",", ".").trim();
  const v = brut ? Math.round(Number(brut) * 10) / 10 : null;
  if (v !== null && !(v >= 8 && v <= 25)) return;
  const supabase = await createClient();
  await supabase.from("reath").update({ vma: v, maj_le: new Date().toISOString() }).eq("client_id", clientId);
  rafraichir(clientId);
}
