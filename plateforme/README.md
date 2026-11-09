# PT Mouss IA — Plateforme (Next.js + Supabase)

La version « vraie appli » de PT Mouss IA : **comptes clients** (email + mot de passe),
**données en ligne** synchronisées sur tous les appareils, et un **espace coach**
pour suivre les séances et les charges de chaque client.

La PWA d'origine (dossier `public/` à la racine du dépôt) n'est pas touchée et reste en ligne.

---

## Mise en route — environ 20 minutes, une seule fois

### 1. Créer la base de données (Supabase, gratuit)

1. Va sur **supabase.com** → crée un compte → **New project**.
   Nom : `ptmouss` · Région : **West EU (Paris)** · note bien le mot de passe de la base.
2. Une fois le projet prêt : menu de gauche **SQL Editor** → **New query**.
3. Copie-colle **tout** le fichier `supabase/migrations/0001_init.sql` → **Run**.
   Tu dois voir « Success. No rows returned ».
4. Menu **Project Settings → API Keys** : récupère
   - l'**URL du projet** (`https://xxxx.supabase.co`, aussi visible dans *Data API*)
   - la **Publishable key** (`sb_publishable_…`)

### 2. Mettre l'appli en ligne (Vercel)

1. **vercel.com** → **Add New → Project** → importe le dépôt `PT_Mouss_App`.
2. **Root Directory** : clique sur *Edit* et choisis **`plateforme`** (important).
3. **Environment Variables** — ajoute les deux :
   | Nom | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | l'URL du projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la clé `sb_publishable_…` |
4. **Deploy**. Tu obtiens une adresse du type `https://ptmouss-plateforme.vercel.app`.

### 3. Relier Supabase à cette adresse

Supabase → **Authentication → URL Configuration** :
- **Site URL** : ton adresse Vercel
- **Redirect URLs** : ajoute `https://TON-ADRESSE.vercel.app/auth/confirm`

(Sans ça, le lien de confirmation reçu par email ne ramènera pas dans l'appli.)

### 4. Devenir coach

1. Ouvre ton appli → **Créer un compte** avec TON email → confirme via l'email reçu.
2. Supabase → **SQL Editor** → lance (avec ton email) :
   ```sql
   update public.profiles set role = 'coach'
     where id = (select id from auth.users where email = 'ton-email@exemple.com');
   ```
3. Reconnecte-toi : l'onglet **🧭 Coach** apparaît dans la barre du bas.

### 5. Inviter tes clients

Envoie-leur le lien. Ils créent leur compte, font leur bilan, et apparaissent
automatiquement dans ton espace coach.
Pour l'installer comme une app : Safari → Partager → « Sur l'écran d'accueil »
(iPhone), ou Chrome → ⋮ → « Installer l'application » (Android).

---

## Ce que fait l'appli

**Côté client**
- Inscription / connexion par email + mot de passe
- Bilan (mêmes questions que la PWA) → programme généré automatiquement
- 5 protocoles, cycles de phases JIGI, deload, jauge de volume SRA
- Check-in du jour → score de forme, séance normale / allégée / à reporter
- Tracker de séance : séries à cocher, timer de repos, charges pré-remplies,
  **progression AMRAP** (même moteur que la PWA), fiches exercices + vidéos
- Suivi : courbe des charges par exercice, historique détaillé

**Côté coach** (onglet 🧭)
- Tous tes clients, triés par urgence
- Alertes : douleur signalée, cible AMRAP manquée, charge en baisse,
  stagnation sur 3 séances, absence de 7 jours et plus
- Fiche client : programme et phase en cours, check-ins sur 14 jours,
  courbes de charges, chaque séance en détail (séries, kg, reps de la dernière série, notes)

**Sécurité** : chaque client ne voit que ses propres données. Le coach lit tout
mais ne peut rien modifier chez un client. Personne ne peut se donner le rôle
coach depuis l'appli. Tout est garanti par la base elle-même (Row Level Security),
pas seulement par l'interface.

**Invariants JIGI conservés** : douleur → arrêt + professionnel de santé ;
aucun compteur de calories ; aucune estimation de masse grasse ;
objectif « me sentir mieux » → on célèbre la régularité, pas les chiffres.

---

## Pas encore repris de la PWA

À ajouter dans les prochaines versions : version anglaise, compteurs eau / pas,
calendrier roadmap, comparaison de cycles, photos de progression, bilan
hebdomadaire WhatsApp, chat coach IA, écran nutrition détaillé.
Les historiques déjà stockés dans les téléphones (localStorage de la PWA)
ne sont pas importés automatiquement.

---

## Pour les développeurs

```bash
cd plateforme
cp .env.example .env.local   # puis renseigner les 2 variables
npm install
npm run dev                  # http://localhost:3000
```

- `src/lib/coaching/` — moteur de coaching (port fidèle de la PWA, vérifié identique
  sur toutes les combinaisons de bilan)
- `src/lib/data.ts` — lectures Supabase · `src/app/(app)/actions.ts` — écritures
- `supabase/migrations/` — schéma + règles de sécurité
