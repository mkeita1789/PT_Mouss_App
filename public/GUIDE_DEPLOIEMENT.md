# 🚀 METTRE L'APP SUR LES TÉLÉPHONES — 15 minutes

> Une vraie app mobile : icône sur l'écran d'accueil, plein écran, animations,
> mode hors-ligne, mémoire des charges. **Sans App Store, sans Mac, sans code.**

---

## CE QUE CONTIENT LE DOSSIER

```
PT_Mouss_App/
├── public/
│   ├── index.html      ← l'app (design + animations)
│   ├── app.js          ← la logique (bilan, 5 protocoles, séance, suivi)
│   ├── manifest.json   ← ce qui en fait une "vraie app" installable
│   ├── sw.js           ← mode hors-ligne (marche sans connexion à la salle)
│   ├── icon-192.png    ← icône JC
│   └── icon-512.png
├── api/coach.js        ← chat coach IA (OPTIONNEL — voir plus bas)
└── vercel.json
```

---

## ÉTAPE 1 — Mettre en ligne (10 min, une seule fois)

### Option A : Netlify (le plus simple)
1. Va sur **app.netlify.com** → crée un compte gratuit.
2. Page d'accueil → zone **« Drag and drop your site folder »**.
3. **Glisse le dossier `public`** (juste lui) dans la zone.
4. 30 secondes plus tard tu as une adresse du type `https://ptmouss.netlify.app`.
5. (Facultatif) Site settings → Change site name → choisis `ptmouss-jigi`.

### Option B : Vercel (si tu veux le chat coach IA un jour)
1. **vercel.com** → compte gratuit → « Add New → Project ».
2. Glisse **tout le dossier `PT_Mouss_App`**.
3. Deploy. Adresse du type `https://ptmouss.vercel.app`.

> ⚠️ L'adresse est publique mais introuvable sans le lien. Pour 5-10 proches, c'est suffisant.
> Ne mets aucune donnée personnelle DANS l'app elle-même.

---

## ÉTAPE 2 — Installer sur chaque téléphone (2 min/personne)

Envoie le lien par WhatsApp, puis :

**iPhone (Safari obligatoirement)**
1. Ouvrir le lien dans **Safari**
2. Bouton **Partager** (carré avec flèche)
3. **« Sur l'écran d'accueil »** → Ajouter

**Android (Chrome)**
1. Ouvrir le lien dans **Chrome**
2. Menu **⋮** → **« Ajouter à l'écran d'accueil »** (ou bannière « Installer »)

✅ L'icône **JC or sur noir** apparaît. L'app s'ouvre **en plein écran**, sans barre de navigateur.

---

## CE QUE FAIT L'APP

| Onglet | Contenu |
|--------|---------|
| 👤 **Profil** | Bilan complet (objectif, niveau, fréquence, santé, sommeil + questions football si perf) |
| 📋 **Programme** | Généré selon le protocole : Fessiers (officiel) · Muscle · Perte de gras · Football (avec écran REPOS IMPOSÉ en coupure) · Bien-être. Jauge de volume SRA. |
| 🔥 **Séance** | Tracker animé : séries qui se cochent (rebond), saisie des kg, **timer de repos circulaire 60 s** avec vibration, célébration confettis à la fin |
| 📈 **Suivi** | Progression des charges en barres animées + historique |

**La mémoire est sur le téléphone** (localStorage) : le profil, l'historique, et
**les charges de la dernière séance se rechargent automatiquement**.

⚠️ Conséquence : si la personne **supprime l'app ou vide le cache, tout est perdu.**
Pas de compte, pas de cloud — c'est le prix de la simplicité.

---

## LE CHAT COACH IA (optionnel, plus tard)

L'app marche à 100 % sans. Si un jour tu veux le chat intégré :
1. Déploie sur **Vercel** (option B) avec le dossier `api/`.
2. Crée une clé API sur **console.anthropic.com** (payant à l'usage, quelques centimes/conversation).
3. Vercel → Settings → **Environment Variables** → `ANTHROPIC_API_KEY` = ta clé.
4. Redéploie.

---

## METTRE À JOUR L'APP

Tu changes un fichier → tu re-glisses le dossier sur Netlify/Vercel.
**Tous les téléphones ont la mise à jour** à la prochaine ouverture. Rien à réinstaller.

---

## LES 3 CHOSES À DIRE À TES PROCHES

> 1. **Douleur** (pas courbature) → tu arrêtes et tu m'appelles MOI.
> 2. L'app donne le programme — **pour la nutrition et le moral, tu passes par moi.**
> 3. Ne supprime pas l'app : ton historique est dedans.

---

> **« Discipline today, results tomorrow. »**
