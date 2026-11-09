import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PhotosProgression } from "@/components/PhotosProgression";
import { getPhotos, getUtilisateur } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { donnerAccord } from "./actions";

export const metadata = { title: "Photos — Baara" };

export default async function Page() {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const P = T.photos;
  const photos = user.photosAccord ? await getPhotos(user.id) : [];

  return (
    <div className="reveal" style={{ maxWidth: 760 }}>
      <header className="page-head">
        <Link href="/suivi" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {T.nav.progression}
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{P.titre}</h1>
        <p className="page-lede" style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon nom="profil" taille={16} /> {P.meta}</p>
      </header>

      {user.photosAccord ? (
        <PhotosProgression uid={user.id} photos={photos} />
      ) : (
        <form action={donnerAccord} className="panel">
          <div className="section-title">{P.accordTitre}</div>
          <ul className="accord-liste">
            {P.accordPoints.map((t) => (
              <li key={t}><Icon nom="check" taille={17} className="gold" /> <span>{t}</span></li>
            ))}
          </ul>
          <label className="accord-case">
            <input type="checkbox" name="accord" value="oui" required />
            <span>{P.accordCase}</span>
          </label>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
            <Icon nom="photo" taille={18} /> {P.accordBouton}
          </button>
        </form>
      )}
    </div>
  );
}
