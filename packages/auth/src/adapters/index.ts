/**
 * @ymjin/auth/adapters — external storage implementations.
 *
 * Two orthogonal concerns, each optional:
 *
 * - **DB adapter** (`AuthAdapter`) — persists users + linked provider accounts.
 *   Pass as `config.adapter`. Makes the session `user.id` your database id.
 *
 * - **Session store** (`SessionStore`) — keeps sessions server-side so the
 *   cookie holds only an opaque id. Pass as `config.sessionStore`. Enables
 *   instant logout / invalidation.
 *
 * Implementations here:
 * - `InMemoryAdapter` / `InMemorySessionStore` — dev, tests, demos.
 * - `SupabaseAdapter` / `SupabaseSessionStore` — production (bring your client).
 *
 * The interfaces themselves live in the core entry so you can implement your
 * own against any database:
 * ```ts
 * import type { AuthAdapter, SessionStore } from "@ymjin/auth";
 * ```
 */

export { InMemoryAdapter, InMemorySessionStore } from "./memory.js";
export {
  SupabaseAdapter,
  SupabaseSessionStore,
} from "./supabase.js";
export type {
  SupabaseClientLike,
  SupabaseAdapterOptions,
  SupabaseSessionStoreOptions,
} from "./supabase.js";

// Re-export the contracts so `@ymjin/auth/adapters` is self-contained.
export type {
  AuthAdapter,
  AdapterUser,
  AdapterAccount,
  SessionStore,
} from "../core/types.js";
