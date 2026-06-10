/**
 * In-memory adapter + session store.
 *
 * For development, tests, and single-process demos only — all state lives in
 * the process and is lost on restart. For production use `SupabaseAdapter` /
 * `SupabaseSessionStore` or your own {@link AuthAdapter} / {@link SessionStore}.
 */

import type {
  AdapterAccount,
  AdapterUser,
  AuthAdapter,
  NormalizedProfile,
  Session,
  SessionStore,
} from "../core/types.js";

// ── InMemoryAdapter ─────────────────────────────────────────────────────────

export class InMemoryAdapter implements AuthAdapter {
  private readonly users = new Map<string, AdapterUser>();
  /** key: `${provider}:${providerAccountId}` → userId */
  private readonly accounts = new Map<string, string>();
  private seq = 0;

  // Deterministic ids (no Math.random) so tests stay reproducible.
  private nextId(): string {
    this.seq += 1;
    return `user_${this.seq}`;
  }

  private accountKey(provider: string, providerAccountId: string): string {
    return `${provider}:${providerAccountId}`;
  }

  async getUserByAccount(
    provider: string,
    providerAccountId: string,
  ): Promise<AdapterUser | null> {
    const userId = this.accounts.get(this.accountKey(provider, providerAccountId));
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  async createUser(profile: NormalizedProfile): Promise<AdapterUser> {
    const user: AdapterUser = {
      id:            this.nextId(),
      email:         profile.email,
      emailVerified: profile.emailVerified,
      name:          profile.name,
      avatarUrl:     profile.avatarUrl,
    };
    this.users.set(user.id, user);
    return user;
  }

  async linkAccount(userId: string, account: AdapterAccount): Promise<void> {
    this.accounts.set(
      this.accountKey(account.provider, account.providerAccountId),
      userId,
    );
  }

  async getUser(id: string): Promise<AdapterUser | null> {
    return this.users.get(id) ?? null;
  }

  async updateUser(
    id: string,
    data: Partial<Omit<AdapterUser, "id">>,
  ): Promise<AdapterUser> {
    const existing = this.users.get(id);
    if (!existing) throw new Error(`[@kitforge/auth] InMemoryAdapter: no user ${id}`);
    const updated = { ...existing, ...data, id };
    this.users.set(id, updated);
    return updated;
  }
}

// ── InMemorySessionStore ────────────────────────────────────────────────────

interface StoredSession {
  session: Session;
  /** UNIX epoch ms when this entry expires. */
  expiresAtMs: number;
}

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, StoredSession>();

  async get(sessionId: string): Promise<Session | null> {
    const entry = this.sessions.get(sessionId);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAtMs) {
      // Lazily evict expired sessions.
      this.sessions.delete(sessionId);
      return null;
    }
    return entry.session;
  }

  async set(sessionId: string, session: Session, maxAgeSeconds: number): Promise<void> {
    this.sessions.set(sessionId, {
      session,
      expiresAtMs: Date.now() + maxAgeSeconds * 1000,
    });
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
