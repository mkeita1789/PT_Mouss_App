/* Photo de profil, ou l'initiale si pas de photo (utilisable côté serveur et client) */
export function Avatar({ url, nom, className = "", style }: { url: string | null | undefined; nom: string; className?: string; style?: React.CSSProperties }) {
  if (url)
    // eslint-disable-next-line @next/next/no-img-element -- lien signé privé et temporaire : pas d'optimisation d'image
    return <img src={url} alt="" className={`avatar avatar-img ${className}`} style={style} />;
  return <span className={`avatar ${className}`} style={style}>{(nom.trim()[0] ?? "?").toUpperCase()}</span>;
}
