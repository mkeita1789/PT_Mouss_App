"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { importerDepuisPWA, type ResultatImport } from "@/app/importer/actions";
import { Icon } from "./Icon";

export const CLE_IMPORT = "ptmouss.import";

type Paquet = { profile?: { prenom?: string } | null; history?: unknown[]; checkins?: Record<string, unknown> };

/* Décodage du code transmis par la PWA : "z" = gzip + base64url, "j" = JSON + base64url */
async function decoder(code: string): Promise<Paquet> {
  const b64 = code.slice(1).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
  if (code[0] === "z") {
    const flux = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(flux).text());
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

const lire = () => { try { return localStorage.getItem(CLE_IMPORT); } catch { return null; } };
const ecrire = (v: string) => { try { localStorage.setItem(CLE_IMPORT, v); } catch {} };
/* Après import : on retire le code en attente et on marque l'ancien historique comme repris.
   Les données de l'ancienne appli ne sont PAS supprimées du téléphone (filet de sécurité). */
const effacer = () => { try { localStorage.removeItem(CLE_IMPORT); localStorage.setItem(CLE_REPRIS, "1"); } catch {} };

const CLE_REPRIS = "ptmouss.ancienneAppliReprise";
const lireJSON = (k: string) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };

/** Historique laissé sur ce téléphone par l'ancienne appli (même adresse, mêmes clés) */
export function ancienHistoriqueLocal(): Paquet | null {
  try { if (localStorage.getItem(CLE_REPRIS)) return null; } catch { return null; }
  const profile = lireJSON("profile");
  const history = lireJSON("history");
  if (!profile && !(Array.isArray(history) && history.length)) return null;
  const daily = lireJSON("daily") ?? {};
  const checkins: Record<string, unknown> = {};
  if (daily && typeof daily === "object")
    Object.entries(daily as Record<string, { checkin?: unknown }>).forEach(([jour, d]) => { if (d?.checkin) checkins[jour] = d.checkin; });
  return { profile, history: Array.isArray(history) ? history : [], checkins };
}

export function Importeur({ connecte }: { connecte: boolean }) {
  const [paquet, setPaquet] = useState<Paquet | null>(null);
  const [etat, setEtat] = useState<"chargement" | "vide" | "invalide" | "pret">("chargement");
  const [resultat, setResultat] = useState<ResultatImport | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    (async () => {
      /* Le code arrive dans le #fragment ; on le met de côté puis on nettoie l'adresse */
      const m = window.location.hash.match(/d=([A-Za-z0-9_-]+)/);
      if (m) {
        ecrire(m[1]);
        history.replaceState(null, "", window.location.pathname);
      }
      const code = m?.[1] ?? lire();
      if (!code) {
        const local = ancienHistoriqueLocal();
        if (!local) return setEtat("vide");
        setPaquet(local);
        return setEtat("pret");
      }
      try {
        setPaquet(await decoder(code));
        setEtat("pret");
      } catch {
        effacer();
        setEtat("invalide");
      }
    })();
  }, []);

  const importer = () =>
    start(async () => {
      const r = await importerDepuisPWA(paquet);
      setResultat(r);
      if (!r.erreur) effacer();
    });

  const nbSeances = paquet?.history?.length ?? 0;
  const nbCheckins = paquet?.checkins ? Object.keys(paquet.checkins).length : 0;

  return (
    <div className="reveal" style={{ maxWidth: 560 }}>
      <header className="page-head">
        <div className="meta">Ton historique sur ce téléphone</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>Reprendre ton historique</h1>
      </header>

      {etat === "chargement" && <div className="panel meta">Lecture du transfert…</div>}

      {etat === "vide" && (
        <div className="panel">
          <div className="section-title">Rien à reprendre sur cet appareil</div>
          <p className="meta" style={{ marginTop: 6 }}>
            Ton ancien historique est stocké sur le téléphone où tu utilisais l'appli. Ouvre PT Mouss sur ce téléphone-là : la reprise te sera proposée automatiquement.
          </p>
        </div>
      )}

      {etat === "invalide" && (
        <div className="note note-ko">
          <span className="note-icon"><Icon nom="alerte" taille={17} /></span>
          <div>Ce lien de transfert est incomplet. Relance le transfert depuis l'ancienne appli.</div>
        </div>
      )}

      {etat === "pret" && paquet && !resultat?.seances && !resultat?.bilan && (
        <>
          <section className="panel panel-hero">
            <div className="today-kicker">Retrouvé sur ce téléphone</div>
            <div className="today-title" style={{ fontSize: 30 }}>{paquet.profile?.prenom || "Ton historique"}</div>
            <div className="today-list" style={{ marginBottom: 6 }}>
              <div className="today-ex" style={{ gridTemplateColumns: "22px 1fr auto" }}><Icon nom="profil" taille={18} className="gold" /><span>Bilan et programme</span><span className="presc">{paquet.profile ? "oui" : "—"}</span></div>
              <div className="today-ex" style={{ gridTemplateColumns: "22px 1fr auto" }}><Icon nom="seance" taille={18} className="gold" /><span>Séances avec charges</span><span className="presc">{nbSeances}</span></div>
              <div className="today-ex" style={{ gridTemplateColumns: "22px 1fr auto" }}><Icon nom="info" taille={18} className="gold" /><span>Check-ins</span><span className="presc">{nbCheckins}</span></div>
            </div>
          </section>

          {connecte ? (
            <>
              <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={pending} onClick={importer}>
                <Icon nom="transfert" taille={18} /> {pending ? "Import en cours…" : "Importer dans mon compte"}
              </button>
              <p className="meta" style={{ marginTop: 12 }}>Si ton compte a déjà un bilan, il est conservé. Tu peux relancer l'import sans créer de doublons.</p>
              <button type="button" className="link" style={{ fontSize: 13, marginTop: 14 }} onClick={() => { effacer(); setEtat("vide"); }}>Ne pas reprendre cet historique</button>
            </>
          ) : (
            <>
              <p className="ink-2" style={{ marginTop: 18 }}>
                Ton historique est bien sur ce téléphone. Crée ton compte (ou connecte-toi) : tu reviendras ici pour l'importer, et il ne pourra plus jamais se perdre.
              </p>
              <div className="btn-row" style={{ marginTop: 16 }}>
                <Link href="/inscription?suite=/importer" className="btn btn-primary">Créer mon compte</Link>
                <Link href="/connexion?suite=/importer" className="btn btn-ghost">Se connecter</Link>
              </div>
            </>
          )}
          {resultat?.erreur && <p className="form-err">{resultat.erreur}</p>}
        </>
      )}

      {resultat && !resultat.erreur && (
        <section className="panel panel-hero">
          <div className="today-kicker">Import terminé</div>
          <div className="today-title" style={{ fontSize: 30 }}>Tout est là</div>
          <p className="today-sub" style={{ marginTop: 10 }}>
            {resultat.seances} séance{(resultat.seances ?? 0) > 1 ? "s" : ""} importée{(resultat.seances ?? 0) > 1 ? "s" : ""}
            {resultat.dejaLa ? `, ${resultat.dejaLa} déjà présente${resultat.dejaLa > 1 ? "s" : ""}` : ""}
            {resultat.bilan ? ", bilan repris" : ""}
            {resultat.checkins ? `, ${resultat.checkins} check-ins` : ""}.
          </p>
          <div className="btn-row" style={{ marginTop: 18 }}>
            <Link href="/suivi" className="btn btn-primary">Voir ma progression</Link>
            <Link href="/" className="btn btn-ghost">Accueil</Link>
          </div>
        </section>
      )}
    </div>
  );
}

/** Bandeau dans l'appli quand un transfert attend sur ce téléphone */
export function TransfertEnAttente() {
  const [attente, setAttente] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stockage du navigateur, absent au rendu serveur
    setAttente((!!lire() || !!ancienHistoriqueLocal()) && window.location.pathname !== "/importer");
  }, []);
  if (!attente) return null;
  return (
    <Link href="/importer" className="note note-gold" style={{ marginTop: 16 }}>
      <span className="note-icon"><Icon nom="transfert" taille={17} /></span>
      <div><b>On a retrouvé ton historique sur ce téléphone.</b> Touche ici pour l'importer dans ton compte.</div>
    </Link>
  );
}

/** Message sur les pages de connexion quand un ancien historique est présent */
export function AncienHistoriqueNotice() {
  const [present, setPresent] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stockage du navigateur, absent au rendu serveur
    setPresent(!!lire() || !!ancienHistoriqueLocal());
  }, []);
  if (!present) return null;
  return (
    <div className="note note-gold" style={{ marginBottom: 24 }}>
      <span className="note-icon"><Icon nom="transfert" taille={17} /></span>
      <div><b>L'appli PT Mouss évolue.</b> Ton historique est bien sur ce téléphone : crée ton compte (ou connecte-toi) pour le garder pour toujours.</div>
    </div>
  );
}
