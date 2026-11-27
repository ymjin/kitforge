-- kitforge/auth — Neon (serverless Postgres) schema
-- Run once against your Neon database before using NeonAdapter / NeonSessionStore.
--
-- Table names match adapter defaults; override via options:
--   NeonAdapter(sql, { usersTable: "my_users" })
--   NeonSessionStore(sql, { sessionsTable: "my_sessions" })

-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kf_users (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text,
  email_verified boolean,
  name           text,
  avatar_url     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION kf_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

DROP TRIGGER IF EXISTS kf_users_updated_at ON kf_users;
CREATE TRIGGER kf_users_updated_at
  BEFORE UPDATE ON kf_users
  FOR EACH ROW EXECUTE FUNCTION kf_set_updated_at();

-- ── Accounts ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kf_accounts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES kf_users (id) ON DELETE CASCADE,
  provider            text        NOT NULL,
  provider_account_id text        NOT NULL,
  access_token        text,
  refresh_token       text,
  id_token            text,
  expires_at          bigint,
  scope               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS kf_accounts_user_id_idx ON kf_accounts (user_id);

-- ── Sessions ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kf_sessions (
  id         text        PRIMARY KEY,
  user_id    uuid        REFERENCES kf_users (id) ON DELETE CASCADE,
  data       jsonb       NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kf_sessions_expires_at_idx ON kf_sessions (expires_at);
CREATE INDEX IF NOT EXISTS kf_sessions_user_id_idx    ON kf_sessions (user_id);

-- ── Webhook failures ──────────────────────────────────────────────────────────
-- Records webhook delivery failures for admin review and manual remediation.
-- Rows are never auto-deleted — admins resolve them after contacting the user.

CREATE TABLE IF NOT EXISTS kf_webhook_failures (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event         text        NOT NULL,              -- 'account.created' | 'account.updated' | 'account.deleted'
  user_id       text        NOT NULL,              -- text (not FK) — user may already be deleted
  user_snapshot jsonb       NOT NULL,              -- snapshot of user at time of failure
  target_url    text        NOT NULL,              -- webhook endpoint that failed
  error         text        NOT NULL,              -- error message
  failed_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz,                       -- set by admin after manual remediation
  notes         text                               -- admin notes
);

CREATE INDEX IF NOT EXISTS kf_webhook_failures_user_id_idx    ON kf_webhook_failures (user_id);
CREATE INDEX IF NOT EXISTS kf_webhook_failures_event_idx      ON kf_webhook_failures (event);
CREATE INDEX IF NOT EXISTS kf_webhook_failures_resolved_at_idx ON kf_webhook_failures (resolved_at)
  WHERE resolved_at IS NULL;                       -- partial index: only unresolved rows

-- ── Purge expired sessions (run via pg_cron or external scheduler) ────────────
-- SELECT cron.schedule('kf_sessions_gc', '*/15 * * * *',
--   $$ DELETE FROM kf_sessions WHERE expires_at < now() $$);
