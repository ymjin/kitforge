-- kitforge/auth — Supabase schema
-- Run once in the Supabase SQL editor before using SupabaseAdapter /
-- SupabaseSessionStore. Table names match the adapter defaults; override via
-- the adapter's `usersTable` / `accountsTable` / `sessionsTable` options.

-- ── Users ────────────────────────────────────────────────────────────────────
create table if not exists kf_users (
  id             uuid primary key default gen_random_uuid(),
  email          text,
  email_verified boolean,
  name           text,
  avatar_url     text,
  created_at     timestamptz not null default now()
);

-- ── Accounts (one row per linked provider identity) ──────────────────────────
create table if not exists kf_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references kf_users (id) on delete cascade,
  provider            text not null,
  provider_account_id text not null,
  access_token        text,
  refresh_token       text,
  id_token            text,
  expires_at          bigint,        -- access-token expiry, UNIX epoch ms
  scope               text,
  created_at          timestamptz not null default now(),
  unique (provider, provider_account_id)
);

create index if not exists kf_accounts_user_id_idx on kf_accounts (user_id);

-- ── Sessions (only needed when using SupabaseSessionStore) ────────────────────
create table if not exists kf_sessions (
  id         text primary key,        -- opaque, high-entropy session id
  data       jsonb not null,          -- the serialized Session object
  expires_at timestamptz not null
);

create index if not exists kf_sessions_expires_at_idx on kf_sessions (expires_at);

-- ── Security ─────────────────────────────────────────────────────────────────
-- These tables are written by the server using the SERVICE ROLE key, which
-- bypasses RLS. Enable RLS and add NO policies so anon/auth clients cannot
-- read or write them directly.
alter table kf_users    enable row level security;
alter table kf_accounts enable row level security;
alter table kf_sessions enable row level security;

-- Optional: purge expired sessions periodically (pg_cron).
-- select cron.schedule('kf_sessions_gc', '*/15 * * * *',
--   $$ delete from kf_sessions where expires_at < now() $$);
