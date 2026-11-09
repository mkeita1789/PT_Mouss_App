"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerPhoto, retirerAccord, supprimerPhoto } from "@/app/(app)/photos/actions";
import type { PhotoProgression, Vue } from "@/lib/data";
import { preparerImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { Comparaison, GrillePhotos } from "./Comparaison";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

const aujourdhui = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());

export function PhotosProgression({ uid, photos }: { uid: string; photos: PhotoProgression[] }) {
  const { lang, T } = useLang();
  const P = T.photos;
  const input = useRef<HTMLInputElement>(null);
  const [vue, setVue] = useState<Vue>("face");
  const [date, setDate] = useState(aujourdhui);
  const [erreur, setErreur] = useState("");
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const envoyer = (f: File | undefined) => {
    if (!f) return;
    setErreur("");
    if (!f.type.startsWith("image/")) return setErreur(T.avatar.format);
    start(async () => {
      try {
        const blob = await preparerImage(f, 1440);
        const chemin = `${uid}/${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("progression").upload(chemin, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        const r = await enregistrerPhoto(chemin, vue, date);
        if (r.erreur) throw new Error(r.erreur);
        /* Enchaîne naturellement face → profil → dos */
        setVue((v) => (v === "face" ? "profil" : v === "profil" ? "dos" : "face"));
      } catch {
        setErreur(P.erreur);
      }
      if (input.current) input.current.value = "";
    });
  };

  return (
    <>
      <section className="panel">
        <div className="section-title">{P.ajouter}</div>
        <div className="field" style={{ marginTop: 14 }}>
          <span>{P.vue}</span>
          <div className="lang-switch" role="radiogroup" aria-label={P.vue} style={{ alignSelf: "flex-start" }}>
            {(["face", "profil", "dos"] as Vue[]).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={v === vue} className={v === vue ? "on" : ""} onClick={() => setVue(v)}>{P.vues[v]}</button>
            ))}
          </div>
        </div>
        <label className="field" style={{ maxWidth: 220 }}>
          <span>{P.date}</span>
          <input type="date" className="input" value={date} max={aujourdhui()} onChange={(e) => setDate(e.target.value || aujourdhui())} />
        </label>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={pending} onClick={() => input.current?.click()}>
          <Icon nom="plus" taille={18} /> {pending ? P.envoi : `${P.ajouter} · ${P.vues[vue]}`}
        </button>
        {erreur && <p className="form-err" style={{ marginTop: 10 }}>{erreur}</p>}
        <p className="meta" style={{ marginTop: 14, fontSize: 13 }}><b style={{ color: "var(--ink-2)" }}>{P.conseilsTitre}.</b> {P.conseils}</p>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => envoyer(e.target.files?.[0])} />
      </section>

      {photos.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">{P.comparer}</h2></div>
          <Comparaison photos={photos} lang={lang} P={P} />
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="section-title">{P.toutes}</h2></div>
        {photos.length ? (
          <GrillePhotos
            photos={photos} lang={lang} P={P}
            action={(p) =>
              aConfirmer === p.id ? (
                <button type="button" className="link ko" style={{ fontSize: 12 }} onClick={() => start(async () => { await supprimerPhoto(p.id); setAConfirmer(null); })}>{P.confirmer}</button>
              ) : (
                <button type="button" className="link" style={{ fontSize: 12, color: "var(--muted)" }} onClick={() => setAConfirmer(p.id)}>{P.supprimer}</button>
              )
            }
          />
        ) : (
          <p className="meta">{P.aucune}</p>
        )}
      </section>

      <div className="section" style={{ textAlign: "center" }}>
        {aConfirmer === "tout" ? (
          <div className="note note-ko" style={{ textAlign: "left" }}>
            <span className="note-icon"><Icon nom="alerte" taille={17} /></span>
            <div>
              {P.confirmerRetrait}
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-sm btn-ghost" style={{ color: "var(--ko)" }} disabled={pending} onClick={() => start(async () => { await retirerAccord(); })}>{P.retirer}</button>
                <button type="button" className="btn btn-sm link" onClick={() => setAConfirmer(null)}>✕</button>
              </div>
            </div>
          </div>
        ) : (
          <button type="button" className="link" style={{ fontSize: 13, color: "var(--muted)" }} onClick={() => setAConfirmer("tout")}>{P.retirer}</button>
        )}
      </div>
    </>
  );
}
