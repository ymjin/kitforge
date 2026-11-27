/**
 * Supabase adapter + session store.
 *
 * Pass your own `@supabase/supabase-js` client (created with the **service
 * role** key on the server) so kitforge never bundles the Supabase SDK and you
 * keep full control of credentials.
 *
 * Run the schema in `schema.sql` (same folder) once before using these.
 *
 * @example
 * ```ts
 * import { createClient } from "@supabase/supabase-js";
 * import { SupabaseAdapter, SupabaseSessionStore } from "@ymjin/auth/adapters";
 *
 * const supabase = createClient(
 *   process.env.SUPABASE_URL!,
 *   process.env.SUPABASE_SERVICE_ROLE_KEY!,   // server-only secret
 * );
 *
 * export const auth = createKitforgeAuth({
 *   providers: [...],
 *   secret:  process.env.AUTH_SECRET!,
 *   baseUrl: process.env.AUTH_URL!,
 *   adapter:      SupabaseAdapter(supabase),
 *   sessionStore: SupabaseSessionStore(supabase),
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
} from "../core/types.js";

/**
 * Minimal structural type for the bits of a supabase-js client we use.
 * Declared locally so this package needs no dependency on `@supabase/supabase-js`.
 * A real `SupabaseClient` satisfies this shape.
 */
export interface SupabaseClientLike {
  from(table: string): {
    select: (columns?: string) => any;
    insert: (values: Record<string, unknown>) => any;
    update: (values: Record<string, unknown>) => any;
    upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => any;
    delete: () => any;
  };
}

export interface SupabaseAdapterOptions {
  /** Users table name. Default: `"kf_users"`. */
  usersTable?: string;
  /** Accounts table name. Default: `"kf_accounts"`. */
  accountsTable?: string;
  /**
   * Optional app-level profiles table to upsert on every sign-in.
   *
   * When set, `syncProfile` upserts `{ id, email, name, avatar_url, updated_at }`
   * into this table on every successful sign-in (new and returning users).
   * The `id` column must match `kf_users.id` so you can join them.
   *
   * Minimal schema:
   * ```sql
   * create table profiles (
   *   id         uuid primary key references kf_users(id) on delete cascade,
   *   email      text,
   *   name       text,
   *   avatar_url text,
   *   updated_at timestamptz not null default now()
   * );
   * ```
   */
  profilesTable?: string;
}

export interface SupabaseSessionStoreOptions {
  /** Sessions table name. Default: `"kf_sessions"`. */
  sessionsTable?: string;
}

// ── SupabaseAdapter ─────────────────────────────────────────────────────────

/** Row shape of the `kf_users` table. */
interface UserRow {
  id: string;
  email: string | null;
  email_verified: boolean | null;
  name: string | null;
  avatar_url: string | null;
}

function rowToUser(row: UserRow): AdapterUser {
  return {
    id:            row.id,
    email:         row.email ?? undefined,
    emailVerified: row.email_verified ?? undefined,
    name:          row.name ?? undefined,
    avatarUrl:     row.avatar_url ?? undefined,
  };
}

export function SupabaseAdapter(
  client: SupabaseClientLike,
  options: SupabaseAdapterOptions = {},
): AuthAdapter {
  const usersTable    = options.usersTable    ?? "kf_users";
  const accountsTable = options.accountsTable ?? "kf_accounts";
  const profilesTable = options.profilesTable;

  return {
    async getUserByAccount(provider, providerAccountId) {
      const { data: account, error: accErr } = await client
        .from(accountsTable)
        .select("user_id")
        .eq("provider", provider)
        .eq("provider_account_id", providerAccountId)
        .maybeSingle();
      if (accErr) throw new Error(`[@ymjin/auth] Supabase getUserByAccount: ${accErr.message}`);
      if (!account) return null;

      const { data: user, error: userErr } = await client
        .from(usersTable)
        .select("*")
        .eq("id", (account as { user_id: string }).user_id)
        .maybeSingle();
      if (userErr) throw new Error(`[@ymjin/auth] Supabase getUserByAccount: ${userErr.message}`);
      return user ? rowToUser(user as UserRow) : null;
    },

    async createUser(profile: NormalizedProfile) {
      const { data, error } = await client
        .from(usersTable)
        .insert({
          email:          profile.email ?? null,
          email_verified: profile.emailVerified ?? null,
          name:           profile.name ?? null,
          avatar_url:     profile.avatarUrl ?? null,
        })
        .select("*")
        .single();
      if (error) throw new Error(`[@ymjin/auth] Supabase createUser: ${error.message}`);
      return rowToUser(data as UserRow);
    },

    async linkAccount(userId: string, account: AdapterAccount) {
      const { error } = await client.from(accountsTable).upsert({
        user_id:             userId,
        provider:            account.provider,
        provider_account_id: account.providerAccountId,
        access_token:        account.accessToken ?? null,
        refresh_token:       account.refreshToken ?? null,
        id_token:            account.idToken ?? null,
        expires_at:          account.expiresAt ?? null,
        scope:               account.scope ?? null,
      }, { onConflict: "provider,provider_account_id" });
      if (error) throw new Error(`[@ymjin/auth] Supabase linkAccount: ${error.message}`);
    },

    async getAccount(userId: string, provider: string) {
      const { data, error } = await client
        .from(accountsTable)
        .select("*")
        .eq("user_id", userId)
        .eq("provider", provider)
        .maybeSingle();
      if (error) throw new Error(`[@ymjin/auth] Supabase getAccount: ${error.message}`);
      if (!data) return null;
      const row = data as Record<string, unknown>;
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

    async getUser(id: string) {
      const { data, error } = await client
        .from(usersTable)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(`[@ymjin/auth] Supabase getUser: ${error.message}`);
      return data ? rowToUser(data as UserRow) : null;
    },

    async syncProfile(userId: string, profile: NormalizedProfile) {
      if (!profilesTable) return;
      const { error } = await client.from(profilesTable).upsert({
        id:         userId,
        email:      profile.email ?? null,
        name:       profile.name ?? null,
        avatar_url: profile.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(`[@ymjin/auth] Supabase syncProfile: ${error.message}`);
    },

    async deleteAccount(userId: string) {
      // kf_accounts and kf_sessions have ON DELETE CASCADE from kf_users,
      // so deleting the user row is sufficient when the schema is correct.
      const { error } = await client.from(usersTable).delete().eq("id", userId);
      if (error) throw new Error(`[@ymjin/auth] Supabase deleteAccount: ${error.message}`);
    },

    async updateUser(id: string, patch: Partial<Omit<AdapterUser, "id">>) {
      const values: Record<string, unknown> = {};
      if ("email"         in patch) values["email"]          = patch.email ?? null;
      if ("emailVerified" in patch) values["email_verified"] = patch.emailVerified ?? null;
      if ("name"          in patch) values["name"]           = patch.name ?? null;
      if ("avatarUrl"     in patch) values["avatar_url"]     = patch.avatarUrl ?? null;

      const { data, error } = await client
        .from(usersTable)
        .update(values)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new Error(`[@ymjin/auth] Supabase updateUser: ${error.message}`);
      return rowToUser(data as UserRow);
    },

    async ping() {
      const { error } = await client.from(usersTable).select("id").limit(1);
      if (error) throw new Error(`[@ymjin/auth] Supabase ping: ${error.message}`);
    },
  };
}

// ── SupabaseSessionStore ────────────────────────────────────────────────────

/** Row shape of the `kf_sessions` table. */
interface SessionRow {
  id: string;
  data: Session;
  expires_at: string; // ISO-8601
}

export function SupabaseSessionStore(
  client: SupabaseClientLike,
  options: SupabaseSessionStoreOptions = {},
): SessionStore {
  const sessionsTable = options.sessionsTable ?? "kf_sessions";

  return {
    async get(sessionId: string) {
      const { data, error } = await client
        .from(sessionsTable)
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw new Error(`[@ymjin/auth] Supabase session get: ${error.message}`);
      if (!data) return null;

      const row = data as SessionRow;
      // Defensive expiry check (a DB cron/RLS policy can also purge rows).
      if (Date.now() >= new Date(row.expires_at).getTime()) {
        await client.from(sessionsTable).delete().eq("id", sessionId);
        return null;
      }
      return row.data;
    },

    async set(sessionId: string, session: Session, _maxAgeSeconds: number) {
      const { error } = await client.from(sessionsTable).upsert({
        id:         sessionId,
        data:       session,
        expires_at: session.expiresAt,
        user_id:    session.user.id,
      });
      if (error) throw new Error(`[@ymjin/auth] Supabase session set: ${error.message}`);
    },

    async delete(sessionId: string) {
      const { error } = await client.from(sessionsTable).delete().eq("id", sessionId);
      if (error) throw new Error(`[@ymjin/auth] Supabase session delete: ${error.message}`);
    },
  };
}

// ── Schema validation ─────────────────────────────────────────────────────────

/** The columns SupabaseAdapter / SupabaseSessionStore require per table. */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  kf_users:    ["id", "email", "email_verified", "name", "avatar_url"],
  kf_accounts: ["id", "user_id", "provider", "provider_account_id",
                 "access_token", "refresh_token", "id_token", "expires_at", "scope"],
  kf_sessions: ["id", "data", "expires_at"],
};

export interface SchemaIssue {
  table:   string;
  column:  string;
  problem: "missing_column" | "not_null_without_default";
}

export interface CheckSchemaOptions {
  usersTable?:    string;
  accountsTable?: string;
  sessionsTable?: string;
}

/**
 * Validate that the required kitforge tables and columns exist in Supabase.
 *
 * Queries `information_schema.columns` (available on every Supabase project).
 * Returns an array of issues — empty means the schema is correct.
 *
 * Requires a client with the **service role** key (anon key cannot read
 * `information_schema`).
 *
 * @example
 * ```ts
 * const issues = await checkSchema(supabase);
 * if (issues.length > 0) {
 *   console.error("Schema issues:", issues);
 *   // Run the migration SQL from @ymjin/auth/adapters/schema.sql
 * }
 * ```
 */
export async function checkSchema(
  client: SupabaseClientLike,
  options: CheckSchemaOptions = {},
): Promise<SchemaIssue[]> {
  const tableMap: Record<string, string> = {
    [options.usersTable    ?? "kf_users"]:    "kf_users",
    [options.accountsTable ?? "kf_accounts"]: "kf_accounts",
    [options.sessionsTable ?? "kf_sessions"]: "kf_sessions",
  };
  const tableNames = Object.keys(tableMap);

  // information_schema is a view, not a Supabase table — query it via rpc or
  // fall back to a lightweight probe: try selecting each required column.
  const issues: SchemaIssue[] = [];

  for (const actualTable of tableNames) {
    const templateKey = tableMap[actualTable]!;
    const required    = REQUIRED_COLUMNS[templateKey] ?? [];

    for (const col of required) {
      // Probe by selecting the column with limit 0 — fails fast if missing.
      const { error } = await (client.from(actualTable) as any)
        .select(col)
        .limit(0);

      if (error) {
        // Supabase returns code "42703" (undefined_column) for missing columns.
        issues.push({ table: actualTable, column: col, problem: "missing_column" });
      }
    }
  }

  return issues;
}
