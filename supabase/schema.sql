-- À exécuter dans Supabase > SQL Editor

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  whatsapp_group_created boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists teams_name_lower_idx on teams (lower(name));

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone_e164 text not null,
  whatsapp_e164 text not null,
  city text,
  mode text not null check (mode in ('team', 'solo')),
  team_id uuid references teams(id) on delete set null,
  is_leader boolean not null default false,
  skills text[] not null default '{}',
  level text,
  idea text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists participants_email_lower_idx on participants (lower(email));
create index if not exists participants_team_idx on participants (team_id);

-- Sécurité : RLS activée, aucune policy publique.
-- Toutes les lectures/écritures passent par les routes API serveur (clé service role).
alter table teams enable row level security;
alter table participants enable row level security;
