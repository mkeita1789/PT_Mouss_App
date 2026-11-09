# Baara — JIGI Coaching (anciennement PT Mouss IA)

Une seule appli : **https://pt-mouss-app.vercel.app**

| Dossier | Contenu |
|---|---|
| `plateforme/` | L'appli (Next.js + Supabase) : comptes clients, programmes, séances, progression, espace coach. Voir `plateforme/README.md`. |
| `ancienne-pwa/` | L'ancienne appli (HTML/JS, données dans le téléphone), gardée pour référence. N'est plus en ligne. |

## Passage de l'ancienne appli à la nouvelle

La nouvelle appli a pris la place de l'ancienne **à la même adresse** :

- l'icône déjà installée sur les téléphones ouvre directement la nouvelle appli ;
- l'ancien mode hors-ligne est automatiquement nettoyé (`plateforme/public/sw.js`) ;
- l'historique stocké dans le téléphone (bilan, séances, check-ins) est détecté et
  le client l'importe dans son compte en un geste (page `/importer`). Les données
  locales ne sont jamais supprimées ;
- l'ancienne adresse de la plateforme (`ptmouss-plateforme.vercel.app`) redirige ici.
