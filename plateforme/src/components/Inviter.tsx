"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "@/lib/i18n";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

const BASE = "https://pt-mouss-app.vercel.app/inscription";

const MESSAGE: Record<Lang, (c: string, LIEN: string) => string> = {
  fr: (c, LIEN) =>
    `Salut ! 👋\n\nTon appli de coaching Baara est prête 💪 Programme personnalisé, séances guidées et suivi de ta progression.\n\n👉 Crée ton compte : ${LIEN}\n\n📲 Pour l'installer : iPhone → Safari, Partager, « Sur l'écran d'accueil ». Android → Chrome, menu ⋮, « Installer l'application ».\n\nÀ très vite !\n${c}`,
  en: (c, LIEN) =>
    `Hi! 👋\n\nYour Baara coaching app is ready 💪 Personalised program, guided workouts and progress tracking.\n\n👉 Create your account: ${LIEN}\n\n📲 To install it: iPhone → Safari, Share, « Add to Home Screen ». Android → Chrome, menu ⋮, « Install app ».\n\nSee you soon!\n${c}`,
};

/** Inviter une cliente : partage du téléphone, WhatsApp, SMS, lien ou QR code à scanner */
export function Inviter({ coach, code, generique }: { coach: string; code?: string | null; generique?: boolean }) {
  const { lang, T } = useLang();
  /* Le coach historique garde ses textes ; les autres professionnels ont des textes neutres */
  const I = generique ? { ...T.inviter, bouton: T.metiers.inviter, titre: T.metiers.inviterTitre, aide: T.metiers.inviterAide } : T.inviter;
  /* Avec le code, la personne est reliée au professionnel dès son inscription */
  const LIEN = code ? `${BASE}?code=${code}` : BASE;
  const [ouvert, setOuvert] = useState(false);
  const [langue, setLangue] = useState<Lang>(lang);
  const [qr, setQr] = useState("");
  const [copie, setCopie] = useState(false);
  const [partage, setPartage] = useState(false);
  const texte = MESSAGE[langue](generique ? coach || "Coach" : coach || "Coach", LIEN);

  useEffect(() => {
    if (!ouvert) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capacité du navigateur, inconnue au rendu serveur
    setPartage(typeof navigator.share === "function");
    QRCode.toDataURL(LIEN, { margin: 1, width: 440, errorCorrectionLevel: "M", color: { dark: "#111114", light: "#ffffff" } }).then(setQr).catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ouvert, LIEN]);

  const partager = async () => {
    try { await navigator.share({ title: "Baara", text: texte }); } catch {}
  };
  const copier = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch {}
  };

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOuvert(true)}>
        <Icon nom="plus" taille={16} /> {I.bouton}
      </button>
      {ouvert && createPortal(
        <div className="sheet-back" onClick={(e) => e.target === e.currentTarget && setOuvert(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={I.titre}>
            <button className="sheet-close" type="button" onClick={() => setOuvert(false)} aria-label={T.fiche.fermer} autoFocus><Icon nom="plus" taille={18} /></button>
            <h2 style={{ paddingRight: 44 }}>{I.titre}</h2>
            <p style={{ marginTop: 8 }}>{I.aide}</p>

            <div className="lang-switch" role="radiogroup" aria-label={I.langue} style={{ marginTop: 16 }}>
              {(["fr", "en"] as Lang[]).map((l) => (
                <button key={l} type="button" role="radio" aria-checked={langue === l} className={langue === l ? "on" : ""} onClick={() => setLangue(l)}>{l === "fr" ? "Message en français" : "Message in English"}</button>
              ))}
            </div>

            <div className="inviter-actions">
              {partage && <button type="button" className="btn btn-primary" onClick={partager}><Icon nom="transfert" taille={18} /> {I.partager}</button>}
              <a className="btn btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer"><Icon nom="message" taille={18} /> WhatsApp</a>
              <a className="btn btn-ghost" href={`sms:?&body=${encodeURIComponent(texte)}`}><Icon nom="message" taille={18} /> SMS</a>
              <button type="button" className="btn btn-ghost" onClick={() => copier(texte)}><Icon nom="check" taille={18} /> {copie ? I.copie : I.copierMessage}</button>
            </div>

            <h3>{I.lien}</h3>
            <div className="inviter-lien">
              <code>{LIEN.replace("https://", "")}</code>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => copier(LIEN)}>{copie ? I.copie : I.copier}</button>
            </div>

            <h3>{I.qr}</h3>
            <p>{I.qrAide}</p>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element -- image générée dans le navigateur
              <img src={qr} alt={I.qr} className="inviter-qr" />
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
