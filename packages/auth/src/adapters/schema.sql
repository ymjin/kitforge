-- kitforge/auth — Supabase schema
-- Run once in the Supabase SQL editor before using SupabaseAdapter /
-- SupabaseSessionStore.
--
-- Table names match the adapter defaults; override via the adapter options:
--   SupabaseAdapter(client, { usersTable: "my_users", accountsTable: "my_accounts" })
--   SupabaseSessionStore(client, { sessionsTable: "my_sessions" })

-- ── Users ────────────────────────────────────────────────────────────────────
create table if not exists kf_users (
  id             uuid        primary key default gen_random_uuid(),
  email          text,
  email_verified boolean,
  name           text,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Auto-update updated_at on every row change.
create or replace function kf_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists kf_users_updated_at on kf_users;
create trigger kf_users_updated_at
  before update on kf_users
  for each row execute function kf_set_updated_at();

-- ── Accounts (one row per linked provider identity) ──────────────────────────
-- Columns used by SupabaseAdapter:
--   user_id, provider, provider_account_id,
--   access_token, refresh_token, id_token, expires_at, scope
-- Extra columns (nullable, not written by the adapter — safe to keep):
--   token_type, session_state
create table if not exists kf_accounts (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references kf_users (id) on delete cascade,
  provider            text        not null,
  provider_account_id text        not null,
  access_token        text,
  refresh_token       text,
  id_token            text,
  expires_at          bigint,                  -- access-token expiry, UNIX epoch ms
  scope               text,
  token_type          text,                    -- not written by adapter; always nullable
  session_state       text,                    -- not written by adapter; always nullable
  created_at          timestamptz not null default now(),
  unique (provider, provider_account_id)
);

create index if not exists kf_accounts_user_id_idx on kf_accounts (user_id);

-- ── Sessions (only needed when using SupabaseSessionStore) ────────────────────
-- Columns used by SupabaseSessionStore: id, data, expires_at
-- user_id is not used by the store but is safe to keep as an extra column.
create table if not exists kf_sessions (
  id         text        primary key,          -- opaque, high-entropy session id
  user_id    uuid        references kf_users (id) on delete cascade,
  data       jsonb       not null,             -- the serialized Session object
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists kf_sessions_expires_at_idx on kf_sessions (expires_at);

-- ── Security ─────────────────────────────────────────────────────────────────
-- These tables are written only via the SERVICE ROLE key (bypasses RLS).
-- Enable RLS with no policies so anon/auth clients cannot read or write them.
alter table kf_users    enable row level security;
alter table kf_accounts enable row level security;
alter table kf_sessions enable row level security;

-- ── Migration helper (existing tables) ───────────────────────────────────────
-- If you already have these tables, run only the alter statements below to add
-- missing columns without recreating the tables.
--
-- alter table kf_users    add column if not exists updated_at     timestamptz not null default now();
-- alter table kf_accounts add column if not exists token_type     text;
-- alter table kf_accounts add column if not exists session_state  text;
-- alter table kf_sessions add column if not exists created_at     timestamptz not null default now();
--
-- IMPORTANT: if token_type or session_state were NOT NULL, make them nullable:
-- alter table kf_accounts alter column token_type    drop not null;
-- alter table kf_accounts alter column session_state drop not null;

-- ── Optional: purge expired sessions periodically (pg_cron) ──────────────────
-- select cron.schedule('kf_sessions_gc', '*/15 * * * *',
--   $$ delete from kf_sessions where expires_at < now() $$);
