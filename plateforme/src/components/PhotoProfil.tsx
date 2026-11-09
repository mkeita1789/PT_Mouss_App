"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerAvatar, supprimerAvatar } from "@/app/(app)/photos/actions";
import { preparerImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";
import { useLang } from "./Langue";

export function PhotoProfil({ uid, nom, url }: { uid: string; nom: string; url: string | null }) {
  const { T } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();

  const choisir = (f: File | undefined) => {
    if (!f) return;
    setErreur("");
    if (!f.type.startsWith("image/")) return setErreur(T.avatar.format);
    start(async () => {
      try {
        const blob = await preparerImage(f, 512, true);
        setApercu(URL.createObjectURL(blob));
        const chemin = `${uid}/${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("avatars").upload(chemin, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        const r = await enregistrerAvatar(chemin);
        if (r.erreur) throw new Error(r.erreur);
      } catch {
        setApercu(null);
        setErreur(T.avatar.erreur);
      }
      if (input.current) input.current.value = "";
    });
  };

  const actuelle = apercu ?? url;
  return (
    <div className="photo-profil">
      <Avatar url={actuelle} nom={nom} className="avatar-xl" style={pending ? { opacity: 0.55 } : undefined} />
      <div style={{ minWidth: 0 }}>
        <div className="btn-row" style={{ flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? T.avatar.envoi : actuelle ? T.avatar.changer : T.avatar.ajouter}
          </button>
          {actuelle && !pending && (
            <button type="button" className="btn btn-sm link" style={{ paddingInline: 6 }} onClick={() => start(async () => { setApercu(null); await supprimerAvatar(); })}>
              {T.avatar.supprimer}
            </button>
          )}
        </div>
        {erreur && <p className="form-err" style={{ marginTop: 8 }}>{erreur}</p>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => choisir(e.target.files?.[0])} />
    </div>
  );
}
