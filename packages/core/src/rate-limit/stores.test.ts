import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { createRateLimiter } from "./index.js";
import { firestoreRateStore, rateLimitTableSql, sqlRateStore, type FirestoreLike, type SqlQuery } from "./stores.js";

const LIMIT = { name: "login", max: 3, windowMs: 60_000 };

describe("sqlRateStore (real Postgres via PGlite)", () => {
  let db: PGlite;
  let query: SqlQuery;
  beforeEach(async () => {
    db = new PGlite();
    await db.exec(rateLimitTableSql());
    query = async (text, params) => (await db.query<Record<string, unknown>>(text, params)).rows;
  });

  it("counts within a window and restarts after it", async () => {
    const s = sqlRateStore(query);
    expect(await s.increment("k", 60_000, 1_000)).toEqual({ count: 1, windowStart: 1_000 });
    expect(await s.increment("k", 60_000, 2_000)).toEqual({ count: 2, windowStart: 1_000 });
    expect(await s.increment("k", 60_000, 61_000)).toEqual({ count: 1, windowStart: 61_000 });
    const { rows } = await db.query<{ expires_at: string | number }>("SELECT expires_at FROM rate_limits WHERE key = 'k'");
    expect(Number(rows[0]!.expires_at)).toBe(121_000);
  });

  it("keeps keys apart and handles epoch-sized ms", async () => {
    const s = sqlRateStore(query);
    const now = Date.UTC(2026, 10, 27);
    await s.increment("a", 1000, now);
    expect(await s.increment("b", 1000, now)).toEqual({ count: 1, windowStart: now });
    expect(await s.increment("a", 1000, now + 1)).toEqual({ count: 2, windowStart: now });
  });

  it("does not lose concurrent hits", async () => {
    const s = sqlRateStore(query);
    await Promise.all(Array.from({ length: 25 }, () => s.increment("c", 60_000, 5_000)));
    expect(await s.increment("c", 60_000, 5_000)).toEqual({ count: 26, windowStart: 5_000 });
  });

  it("works end to end with the limiter and a custom table", async () => {
    await db.exec(rateLimitTableSql("public.login_limits"));
    let t = 0;
    const rl = createRateLimiter({ store: sqlRateStore(query, { table: "public.login_limits" }), now: () => t });
    for (let i = 0; i < 3; i++) expect((await rl.check(LIMIT, "ip")).allowed).toBe(true);
    t = 15_000;
    expect(await rl.check(LIMIT, "ip")).toEqual({ allowed: false, retryAfter: 45 });
  });

  it("rejects unsafe table names", () => {
    expect(() => sqlRateStore(query, { table: "x; DROP TABLE y" })).toThrow(/invalid table/);
    expect(() => rateLimitTableSql("a.b.c")).toThrow(/invalid table/);
  });
});

/** firebase-admin 트랜잭션처럼 동작하는 가짜(직렬 실행). */
function fakeFirestore() {
  const docs = new Map<string, Record<string, unknown>>();
  let chain = Promise.resolve<unknown>(undefined);
  const db: FirestoreLike & { docs: typeof docs } = {
    docs,
    collection: (c) => ({ doc: (id) => `${c}/${id}` }),
    runTransaction<T>(fn: (tx: unknown) => Promise<T>) {
      const run = chain.then(() =>
        fn({
          get: async (ref: string) => ({ data: () => docs.get(ref) }),
          set: (ref: string, d: Record<string, unknown>) => void docs.set(ref, d),
        }),
      );
      chain = run.catch(() => undefined);
      return run;
    },
  };
  return db;
}

describe("firestoreRateStore", () => {
  it("writes review77-compatible fields and counts per window", async () => {
    const db = fakeFirestore();
    const s = firestoreRateStore(db);
    await s.increment("abc", 60_000, 1_000);
    expect(await s.increment("abc", 60_000, 2_000)).toEqual({ count: 2, windowStart: 1_000 });
    expect(db.docs.get("rate_limits/abc")).toEqual({ count: 2, window_start: 1_000, expire_at: new Date(61_000) });
    expect(await s.increment("abc", 60_000, 61_000)).toEqual({ count: 1, windowStart: 61_000 });
  });

  it("continues an existing review77 document", async () => {
    const db = fakeFirestore();
    db.docs.set("rate_limits/k", { count: 4, window_start: 500, expire_at: new Date(60_500) });
    expect(await firestoreRateStore(db).increment("k", 60_000, 1_000)).toEqual({ count: 5, windowStart: 500 });
  });

  it("uses a custom collection", async () => {
    const db = fakeFirestore();
    await firestoreRateStore(db, { collection: "limits" }).increment("k", 1000, 0);
    expect(db.docs.has("limits/k")).toBe(true);
  });
});
