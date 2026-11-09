"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBilan, getUtilisateur } from "@/lib/data";
import { normaliserImport } from "@/lib/coaching/import";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export type ResultatImport = { erreur?: string; bilan?: boolean; seances?: number; dejaLa?: number; checkins?: number };

/** Importe le paquet de la PWA dans le compte connecté. Rejouable sans créer de doublons. */
export async function importerDepuisPWA(paquet: unknown): Promise<ResultatImport> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const data = normaliserImport(paquet);
  if (!data.bilan && !data.seances.length) return { erreur: T.importer.aucuneDonnee };

  const supabase = await createClient();
  const res: ResultatImport = { bilan: false, seances: 0, dejaLa: 0, checkins: 0 };

  /* Bilan : seulement si le compte n'en a pas encore (on n'écrase jamais) */
  if (data.bilan && !(await getBilan(user.id))) {
    const { error } = await supabase.from("bilans").insert({ user_id: user.id, reponses: data.bilan.reponses, debut: data.bilan.debut });
    if (!error) {
      res.bilan = true;
      await supabase.from("profiles").update({ prenom: data.bilan.reponses.prenom }).eq("id", user.id);
    }
  }

  /* Séances : on saute celles déjà importées (même horodatage) */
  const { data: existantes } = await supabase.from("seances").select("realisee_le").eq("user_id", user.id);
  const deja = new Set((existantes ?? []).map((s) => new Date(s.realisee_le).getTime()));
  const nouvelles = data.seances.filter((s) => !deja.has(new Date(s.realisee_le).getTime()));
  res.dejaLa = data.seances.length - nouvelles.length;

  for (let i = 0; i < nouvelles.length; i += 50) {
    const lot = nouvelles.slice(i, i + 50);
    const { data: crees, error } = await supabase
      .from("seances")
      .insert(lot.map((s) => ({ user_id: user.id, realisee_le: s.realisee_le, jour_code: s.jour_code, focus: s.focus, phase: s.phase })))
      .select("id, realisee_le");
    if (error || !crees) return { ...res, erreur: T.importer.arrete };

    const parDate = new Map(crees.map((c) => [new Date(c.realisee_le).getTime(), c.id as string]));
    const lignes = lot.flatMap((s) => {
      const id = parDate.get(new Date(s.realisee_le).getTime());
      return id ? s.exercices.map((e, position) => ({ ...e, seance_id: id, user_id: user.id, position })) : [];
    });
    if (lignes.length) {
      const { error: errEx } = await supabase.from("seance_exercices").insert(lignes);
      if (errEx) {
        await supabase.from("seances").delete().in("id", crees.map((c) => c.id));
        return { ...res, erreur: T.importer.arrete };
      }
    }
    res.seances = (res.seances ?? 0) + crees.length;
  }

  /* Check-ins : un par jour, les existants sont conservés */
  if (data.checkins.length) {
    const { data: ok } = await supabase
      .from("checkins")
      .upsert(data.checkins.map((c) => ({ ...c, user_id: user.id })), { onConflict: "user_id,jour", ignoreDuplicates: true })
      .select("jour");
    res.checkins = ok?.length ?? 0;
  }

  revalidatePath("/", "layout");
  return res;
}
