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
 * import { SupabaseAdapter, SupabaseSessionStore } from "@kitforge/auth/adapters";
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
    upsert: (values: Record<string, unknown>) => any;
    delete: () => any;
  };
}

export interface SupabaseAdapterOptions {
  /** Users table name. Default: `"kf_users"`. */
  usersTable?: string;
  /** Accounts table name. Default: `"kf_accounts"`. */
  accountsTable?: string;
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

  return {
    async getUserByAccount(provider, providerAccountId) {
      const { data: account, error: accErr } = await client
        .from(accountsTable)
        .select("user_id")
        .eq("provider", provider)
        .eq("provider_account_id", providerAccountId)
        .maybeSingle();
      if (accErr) throw new Error(`[@kitforge/auth] Supabase getUserByAccount: ${accErr.message}`);
      if (!account) return null;

      const { data: user, error: userErr } = await client
        .from(usersTable)
        .select("*")
        .eq("id", (account as { user_id: string }).user_id)
        .maybeSingle();
      if (userErr) throw new Error(`[@kitforge/auth] Supabase getUserByAccount: ${userErr.message}`);
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
      if (error) throw new Error(`[@kitforge/auth] Supabase createUser: ${error.message}`);
      return rowToUser(data as UserRow);
    },

    async linkAccount(userId: string, account: AdapterAccount) {
      const { error } = await client.from(accountsTable).insert({
        user_id:             userId,
        provider:            account.provider,
        provider_account_id: account.providerAccountId,
        access_token:        account.accessToken ?? null,
        refresh_token:       account.refreshToken ?? null,
        id_token:            account.idToken ?? null,
        expires_at:          account.expiresAt ?? null,
        scope:               account.scope ?? null,
      });
      if (error) throw new Error(`[@kitforge/auth] Supabase linkAccount: ${error.message}`);
    },

    async getUser(id: string) {
      const { data, error } = await client
        .from(usersTable)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(`[@kitforge/auth] Supabase getUser: ${error.message}`);
      return data ? rowToUser(data as UserRow) : null;
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
      if (error) throw new Error(`[@kitforge/auth] Supabase updateUser: ${error.message}`);
      return rowToUser(data as UserRow);
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
      if (error) throw new Error(`[@kitforge/auth] Supabase session get: ${error.message}`);
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
      });
      if (error) throw new Error(`[@kitforge/auth] Supabase session set: ${error.message}`);
    },

    async delete(sessionId: string) {
      const { error } = await client.from(sessionsTable).delete().eq("id", sessionId);
      if (error) throw new Error(`[@kitforge/auth] Supabase session delete: ${error.message}`);
    },
  };
}
