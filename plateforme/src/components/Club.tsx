"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { definirLogo, definirPhotoMembre, modifierClub, type EtatEquipe } from "@/app/(app)/equipe/actions";
import type { Equipe } from "@/lib/equipe";
import { preparerImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

/** Personnalisation du club : nom, saison, couleurs, logo, valeurs (staff) */
export function FormClub({ equipe, logo }: { equipe: Equipe; logo: string | null }) {
  const { T } = useLang();
  const E = T.equipe;
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(modifierClub.bind(null, equipe.id), undefined);
  const [c1, setC1] = useState(equipe.couleur1 ?? "#c81e1e");
  const [c2, setC2] = useState(equipe.couleur2 ?? "#ffffff");
  return (
    <div className="stack">
      <LogoClub equipeId={equipe.id} url={logo} />
      <form action={action}>
        <label className="field" style={{ marginTop: 0 }}><span>{E.nom}</span><input className="input" name="nom" defaultValue={equipe.nom} required maxLength={60} /></label>
        <label className="field"><span>{E.saison}</span><input className="input" name="saison" defaultValue={equipe.saison ?? ""} maxLength={20} placeholder={E.saisonExemple} /></label>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
          <span>{E.couleurs}</span>
          <div className="couleurs">
            <label><input type="color" name="couleur1" value={c1} onChange={(e) => setC1(e.target.value)} /> {E.couleur1}</label>
            <label><input type="color" name="couleur2" value={c2} onChange={(e) => setC2(e.target.value)} /> {E.couleur2}</label>
            <span className="maillot" aria-hidden style={{ background: `linear-gradient(90deg, ${c1} 0 50%, ${c2} 50% 100%)` }} />
          </div>
        </fieldset>
        <label className="field"><span>{E.valeurs}</span>
          <textarea className="input" name="valeurs" rows={3} maxLength={1000} defaultValue={equipe.valeurs ?? ""} placeholder={E.valeursExemple} style={{ height: "auto", padding: 12, resize: "vertical" }} />
          <small className="meta" style={{ display: "block", marginTop: 6 }}>{E.valeursAide}</small>
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 16 }}>{pending ? T.auth.unInstant : E.enregistrer}</button>
        {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
        {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
      </form>
    </div>
  );
}

function LogoClub({ equipeId, url }: { equipeId: string; url: string | null }) {
  const { T } = useLang();
  const E = T.equipe;
  const input = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();
  const choisir = (f: File | undefined) => {
    if (!f) return;
    setErreur("");
    start(async () => {
      try {
        const blob = await preparerImage(f, 512, true);
        setApercu(URL.createObjectURL(blob));
        const chemin = `${equipeId}/logo-${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("equipes").upload(chemin, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        const r = await definirLogo(equipeId, chemin);
        if (r.erreur) throw new Error(r.erreur);
      } catch {
        setApercu(null);
        setErreur(E.imageTropLourde);
      }
      if (input.current) input.current.value = "";
    });
  };
  const actuel = apercu ?? url;
  return (
    <div className="photo-profil">
      <span className="logo-club" style={pending ? { opacity: 0.55 } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire */}
        {actuel ? <img src={actuel} alt={E.logo} /> : <Icon nom="ballon" taille={28} />}
      </span>
      <div className="btn-row" style={{ flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => input.current?.click()}>{actuel ? E.logoChanger : E.logoAjouter}</button>
        {actuel && !pending && <button type="button" className="link" onClick={() => start(async () => { setApercu(null); await definirLogo(equipeId, null); })}>{E.logoRetirer}</button>}
      </div>
      {erreur && <p className="form-err">{erreur}</p>}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => choisir(e.target.files?.[0])} />
    </div>
  );
}

/** Photo d'un joueur dans l'équipe (staff et responsable média), avec son accord */
export function PhotoMembre({ equipeId, membreId, nom, url }: { equipeId: string; membreId: string; nom: string; url: string | null }) {
  const { T } = useLang();
  const E = T.equipe;
  const input = useRef<HTMLInputElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [accord, setAccord] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();
  const actuel = apercu ?? url;
  const choisir = (f: File | undefined) => {
    if (!f || !accord) return;
    setErreur("");
    start(async () => {
      try {
        const blob = await preparerImage(f, 384, true);
        setApercu(URL.createObjectURL(blob));
        const chemin = `${equipeId}/membres/${membreId}-${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("equipes").upload(chemin, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        const r = await definirPhotoMembre(equipeId, membreId, chemin, true);
        if (r.erreur) throw new Error(r.erreur);
        setOuvert(false);
      } catch {
        setApercu(null);
        setErreur(E.imageTropLourde);
      }
      if (input.current) input.current.value = "";
    });
  };
  return (
    <div className="photo-membre">
      <button type="button" className="photo-mini" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-label={`${E.photo} : ${nom}`} style={pending ? { opacity: 0.5 } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire */}
        {actuel ? <img src={actuel} alt="" /> : <Icon nom="photo" taille={16} />}
      </button>
      {ouvert && (
        <div className="photo-membre-panneau">
          <label className="case" style={{ marginTop: 0, alignItems: "flex-start" }}>
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
            <span style={{ fontSize: 13 }}>{E.photoAccord}</span>
          </label>
          <div className="btn-row" style={{ marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary btn-sm" disabled={!accord || pending} onClick={() => input.current?.click()}>{E.photoEnvoyer}</button>
            {actuel && <button type="button" className="link" onClick={() => start(async () => { setApercu(null); await definirPhotoMembre(equipeId, membreId, null, false); setOuvert(false); })}>{E.photoRetirer}</button>}
          </div>
          {erreur && <p className="form-err">{erreur}</p>}
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => choisir(e.target.files?.[0])} />
        </div>
      )}
    </div>
  );
}
