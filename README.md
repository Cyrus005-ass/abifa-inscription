# ABIFA 2026 — Inscriptions et gestion des équipes

Next.js 14 (App Router) + React + TypeScript + Supabase (Postgres).
Les participants peuvent créer ou rejoindre une équipe, ou s'inscrire sans équipe.
Les inscriptions sont stockées dans Supabase et consultables dans l'espace organisateur
(`/youp`), protégé par mot de passe.

## Lancer en local

1. `npm install`
2. Crée un projet sur https://supabase.com, ouvre **SQL Editor** et exécute `supabase/schema.sql`.
3. Copie `.env.example` en `.env.local` et remplis les 4 variables
   (URL + clé *service_role* dans Supabase > Project Settings > API).
4. `npm run dev` puis ouvre http://localhost:3000 (inscription) et
   http://localhost:3000/youp (organisation).

## Déployer sur Vercel

1. Pousse le projet sur GitHub, puis « Import Project » sur Vercel.
2. Dans **Project Settings > Environment Variables**, crée les variables listées dans `.env.example`.
   Récupère `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans Supabase > Project Settings > API,
   choisis un `ADMIN_PASSWORD` unique et génère un `SESSION_SECRET` avec :
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Redéploie après avoir enregistré les variables. Ne mets jamais la clé service_role dans une variable `NEXT_PUBLIC_*`.
   Le chemin discret de l'espace organisateur ne remplace pas son mot de passe.

## Réglages (src/lib/config.ts)

- `ORGANIZER_WHATSAPP` : numéro de l'organisation, format international sans `+` (actuellement `2290199871252`).
- `REGISTRATION_OPEN` : indique si les inscriptions sont ouvertes (`false` par défaut après leur clôture).
- `TEAM_MAX_SIZE` : 6 membres maximum par équipe (chef compris). `TEAM_MIN_SIZE` : 2.

## Fonctionnement

- **En équipe** : le chef crée l'équipe (nom + code `ABF-XXXX`), les membres rejoignent avec le code.
  Après inscription, le chef peut copier le code pour le partager lui-même.
- **Sans équipe** : profil, niveau, idée. L'organisation les voit dans l'onglet « Sans équipe ».
- **Espace organisateur** : équipes (membres, statut « groupe WhatsApp créé », copier les numéros, contacter le chef),
  sans équipe (sélection manuelle ou « Proposer des équipes »), export CSV, recherche.

## Limites connues

- Le limiteur anti-spam est en mémoire (par instance Vercel) : il freine le spam simple, pas une attaque sérieuse.
- La sécurité repose sur : RLS Supabase sans policy publique + accès base uniquement via les routes API serveur.
