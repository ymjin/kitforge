/**
 * Neon (serverless Postgres) adapter + session store.
 *
 * Pass a `neon` SQL function from `@neondatabase/serverless` (HTTP transport —
 * no persistent connections, ideal for Lambda/Edge).
 *
 * Run `neon-schema.sql` (same folder) once before using these.
 *
 * @example
 * ```ts
 * import { neon } from "@neondatabase/serverless";
 * import { NeonAdapter, NeonSessionStore } from "@ymjin/auth/adapters";
 *
 * const sql = neon(process.env.DATABASE_URL!);
 *
 * export const auth = createKitforgeAuth({
 *   providers: [...],
 *   secret:  process.env.AUTH_SECRET!,
 *   baseUrl: process.env.AUTH_URL!,
 *   adapter:      NeonAdapter(sql),
 *   sessionStore: NeonSessionStore(sql),
 * });
 * ```
 */

import type {
  AdapterAccount,
  AdapterUser,
  AuthAdapter,
  NormalizedProfile,
  Session,
  SessionStore,
  WebhookFailure,
} from "../core/types.js";

/**
 * Minimal structural type for the Neon query function.
 * `neon(DATABASE_URL)` from `@neondatabase/serverless` satisfies this shape.
 *
 * `any` on the first parameter makes both `TemplateStringsArray` (tagged-template
 * call) and `string` (regular function call) assignable, so `NeonQueryFunction`
 * from `@neondatabase/serverless` satisfies this interface without a cast.
 *
 * Table names (developer-controlled config, never user input) are embedded via
 * JS template literals in the query string. All user-supplied values are passed
 * as positional parameters ($1, $2, …).
 */
export interface NeonSqlClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (query: any, ...params: unknown[]): Promise<Record<string, unknown>[]>;
}

export interface NeonAdapterOptions {
  /** Default: `"kf_users"` */
  usersTable?: string;
  /** Default: `"kf_accounts"` */
  accountsTable?: string;
  /** Default: `"kf_webhook_failures"` */
  webhookFailuresTable?: string;
}

export interface NeonSessionStoreOptions {
  /** Default: `"kf_sessions"` */
  sessionsTable?: string;
}

// ── Row types ─────────────────────────────────────────────────────────────────

interface UserRow {
  id:             string;
  email:          string | null;
  email_verified: boolean | null;
  name:           string | null;
  avatar_url:     string | null;
}

interface SessionRow {
  id:         string;
  data:       Session;
  expires_at: string;
}

function rowToUser(row: UserRow): AdapterUser {
  return {
    id:            row.id,
    email:         row.email          ?? undefined,
    emailVerified: row.email_verified ?? undefined,
    name:          row.name           ?? undefined,
    avatarUrl:     row.avatar_url     ?? undefined,
  };
}

// ── NeonAdapter ───────────────────────────────────────────────────────────────

export function NeonAdapter(
  sql: NeonSqlClient,
  options: NeonAdapterOptions = {},
): AuthAdapter {
  const u  = options.usersTable           ?? "kf_users";
  const a  = options.accountsTable        ?? "kf_accounts";
  const wf = options.webhookFailuresTable ?? "kf_webhook_failures";

  return {
    async getUserByAccount(provider, providerAccountId) {
      const rows = await sql(
        `SELECT u.*
         FROM ${u} u
         INNER JOIN ${a} acc ON acc.user_id = u.id
         WHERE acc.provider = $1 AND acc.provider_account_id = $2
         LIMIT 1`,
        provider, providerAccountId,
      );
      return rows[0] ? rowToUser(rows[0] as unknown as UserRow) : null;
    },

    async createUser(profile: NormalizedProfile) {
      const rows = await sql(
        `INSERT INTO ${u} (email, email_verified, name, avatar_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        profile.email         ?? null,
        profile.emailVerified ?? null,
        profile.name          ?? null,
        profile.avatarUrl     ?? null,
      );
      if (!rows[0]) throw new Error("[@ymjin/auth] NeonAdapter createUser: no row returned");
      return rowToUser(rows[0] as unknown as UserRow);
    },

    async linkAccount(userId: string, account: AdapterAccount) {
      await sql(
        `INSERT INTO ${a}
           (user_id, provider, provider_account_id,
            access_token, refresh_token, id_token, expires_at, scope)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (provider, provider_account_id) DO UPDATE
           SET access_token  = EXCLUDED.access_token,
               refresh_token = COALESCE(EXCLUDED.refresh_token, ${a}.refresh_token),
               id_token      = COALESCE(EXCLUDED.id_token, ${a}.id_token),
               expires_at    = EXCLUDED.expires_at,
               scope         = EXCLUDED.scope`,
        userId,
        account.provider,
        account.providerAccountId,
        account.accessToken  ?? null,
        account.refreshToken ?? null,
        account.idToken      ?? null,
        account.expiresAt    ?? null,
        account.scope        ?? null,
      );
    },

    async getUser(id: string) {
      const rows = await sql(`SELECT * FROM ${u} WHERE id = $1 LIMIT 1`, id);
      return rows[0] ? rowToUser(rows[0] as unknown as UserRow) : null;
    },

    async getAccount(userId: string, provider: string) {
      const rows = await sql(
        `SELECT * FROM ${a} WHERE user_id = $1 AND provider = $2 LIMIT 1`,
        userId, provider,
      );
      const row = rows[0];
      if (!row) return null;
      return {
        provider:          row["provider"] as string,
        providerAccountId: row["provider_account_id"] as string,
        accessToken:       (row["access_token"]  as string | null) ?? undefined,
        refreshToken:      (row["refresh_token"] as string | null) ?? undefined,
        idToken:           (row["id_token"]      as string | null) ?? undefined,
        expiresAt:         (row["expires_at"]    as number | null) ?? undefined,
        scope:             (row["scope"]         as string | null) ?? undefined,
      };
    },

    async updateUser(id: string, patch: Partial<Omit<AdapterUser, "id">>) {
      // Build SET clause only for supplied fields.
      const sets: string[] = [];
      const params: unknown[] = [];
      let i = 1;

      if ("email"         in patch) { sets.push(`email = $${i++}`);          params.push(patch.email         ?? null); }
      if ("emailVerified" in patch) { sets.push(`email_verified = $${i++}`); params.push(patch.emailVerified ?? null); }
      if ("name"          in patch) { sets.push(`name = $${i++}`);           params.push(patch.name          ?? null); }
      if ("avatarUrl"     in patch) { sets.push(`avatar_url = $${i++}`);     params.push(patch.avatarUrl     ?? null); }

      if (sets.length === 0) {
        const current = await this.getUser!(id);
        if (!current) throw new Error("[@ymjin/auth] NeonAdapter updateUser: user not found");
        return current;
      }

      params.push(id);
      const rows = await sql(
        `UPDATE ${u} SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
        ...params,
      );
      if (!rows[0]) throw new Error("[@ymjin/auth] NeonAdapter updateUser: user not found");
      return rowToUser(rows[0] as unknown as UserRow);
    },

    async deleteAccount(userId: string) {
      // kf_accounts and kf_sessions cascade from kf_users (see neon-schema.sql).
      await sql(`DELETE FROM ${u} WHERE id = $1`, userId);
    },

    async logWebhookFailure(failure: WebhookFailure) {
      await sql(
        `INSERT INTO ${wf} (event, user_id, user_snapshot, target_url, error, failed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        failure.event,
        failure.userId,
        JSON.stringify(failure.user),
        failure.targetUrl,
        failure.error,
        failure.failedAt,
      );
    },

    async ping() {
      await sql("SELECT 1");
    },
  };
}

// ── NeonSessionStore ──────────────────────────────────────────────────────────

export function NeonSessionStore(
  sql: NeonSqlClient,
  options: NeonSessionStoreOptions = {},
): SessionStore {
  const s = options.sessionsTable ?? "kf_sessions";

  return {
    async get(sessionId: string) {
      const rows = await sql(`SELECT * FROM ${s} WHERE id = $1 LIMIT 1`, sessionId);
      if (!rows[0]) return null;

      const row = rows[0] as unknown as SessionRow;
      if (Date.now() >= new Date(row.expires_at).getTime()) {
        await sql(`DELETE FROM ${s} WHERE id = $1`, sessionId);
        return null;
      }
      // Neon returns jsonb columns as parsed objects already.
      return row.data as Session;
    },

    async set(sessionId: string, session: Session, _maxAgeSeconds: number) {
      await sql(
        `INSERT INTO ${s} (id, user_id, data, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
           SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
        sessionId,
        session.user.id,
        JSON.stringify(session),
        session.expiresAt,
      );
    },

    async delete(sessionId: string) {
      await sql(`DELETE FROM ${s} WHERE id = $1`, sessionId);
    },
  };
}
