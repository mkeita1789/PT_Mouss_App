"use client";

import { useEffect, useState, useTransition } from "react";
import { enregistrerAbonnement, supprimerAbonnement, testerNotification } from "@/app/(app)/profil/notifications";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

type Etat = "chargement" | "non-supporte" | "iphone" | "refusees" | "off" | "on";
const CLE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/* Clé publique (base64 url) → octets, format attendu par le navigateur */
function octets(b64: string) {
  const s = (b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function etatActuel(): Promise<{ etat: Etat; sub: PushSubscription | null }> {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const installee = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return { etat: ios && !installee ? "iphone" : "non-supporte", sub: null };
  if (Notification.permission === "denied") return { etat: "refusees", sub: null };
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = (await reg?.pushManager.getSubscription()) ?? null;
  return { etat: sub && Notification.permission === "granted" ? "on" : "off", sub };
}

/** Réglage des notifications pour CE téléphone (chaque appareil s'active séparément) */
export function Notifications({ coach }: { coach: boolean }) {
  const { T } = useLang();
  const N = T.notifs;
  const [etat, setEtat] = useState<Etat>("chargement");
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; erreur?: string }>({});
  const [pending, start] = useTransition();

  useEffect(() => {
    etatActuel().then((r) => { setEtat(r.etat); setSub(r.sub); }).catch(() => setEtat("non-supporte"));
  }, []);

  const activer = () =>
    start(async () => {
      setMsg({});
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return setEtat(perm === "denied" ? "refusees" : "off");
        const s = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: octets(CLE) }));
        const r = await enregistrerAbonnement(JSON.parse(JSON.stringify(s)));
        if (r.erreur) throw new Error(r.erreur);
        setSub(s);
        setEtat("on");
      } catch {
        setMsg({ erreur: N.erreur });
      }
    });

  const desactiver = () =>
    start(async () => {
      setMsg({});
      if (sub) {
        await supprimerAbonnement(sub.endpoint);
        await sub.unsubscribe().catch(() => {});
      }
      setSub(null);
      setEtat("off");
    });

  const tester = () => start(async () => setMsg(sub ? await testerNotification(sub.endpoint) : { erreur: N.erreur }));

  return (
    <div>
      <p className="meta" style={{ margin: "4px 0 14px" }}>{coach ? N.aideCoach : N.aideClient}</p>
      {etat === "on" ? (
        <>
          <div className="pill pill-ok"><span className="dot" />{N.actives}</div>
          <div className="btn-row" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={tester}><Icon nom="cloche" taille={16} /> {N.tester}</button>
            <button type="button" className="btn btn-sm link" style={{ color: "var(--muted)" }} disabled={pending} onClick={desactiver}>{N.desactiver}</button>
          </div>
        </>
      ) : etat === "off" ? (
        <button type="button" className="btn btn-primary btn-sm" disabled={pending || !CLE} onClick={activer}><Icon nom="cloche" taille={16} /> {N.activer}</button>
      ) : etat === "chargement" ? null : (
        <div className="note note-gold"><span className="note-icon"><Icon nom="info" taille={17} /></span><div>{etat === "iphone" ? N.iphone : etat === "refusees" ? N.refusees : N.nonSupporte}</div></div>
      )}
      {msg.ok && <p className="ok" style={{ marginTop: 10, fontSize: 13.5 }}>{msg.ok}</p>}
      {msg.erreur && <p className="form-err" style={{ marginTop: 10 }}>{msg.erreur}</p>}
    </div>
  );
}
