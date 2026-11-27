/**
 * `RateStore` 어댑터 — Firestore · SQL(Postgres).
 *
 * DB SDK를 의존성으로 두지 않는다 — 필요한 메서드만 구조적 타입으로 받는다.
 * 그래서 firebase-admin · @neondatabase/serverless · postgres · pg · Prisma 어느 판이든 그대로 넘기면 된다.
 */
import type { RateStore, RateWindow } from "./index.js";

const nextWindow = (prev: RateWindow | undefined, windowMs: number, now: number): RateWindow =>
  !prev || now - prev.windowStart >= windowMs
    ? { count: 1, windowStart: now }
    : { count: prev.count + 1, windowStart: prev.windowStart };

// ── Firestore ───────────────────────────────────────────────────────────

/** firebase-admin `Firestore`에서 쓰는 부분만. */
export interface FirestoreLike {
  collection(path: string): { doc(id: string): unknown };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}

export interface FirestoreRateStoreOptions {
  /** 컬렉션 이름. 기본 `rate_limits` */
  collection?: string;
}

/**
 * Firestore 트랜잭션으로 센다. 문서 필드는 `{ count, window_start, expire_at }` —
 * `expire_at`에 Firestore TTL 정책을 걸면 지난 창이 지워진다(콘솔 설정).
 * 키를 그대로 문서 ID로 쓰므로 `createRateLimiter({ hashKeys: true })`와 함께 쓴다.
 */
export function firestoreRateStore(db: FirestoreLike, options: FirestoreRateStoreOptions = {}): RateStore {
  const col = options.collection ?? "rate_limits";
  return {
    increment(key, windowMs, now) {
      const ref = db.collection(col).doc(key);
      return db.runTransaction(async (tx: { get(r: unknown): Promise<{ data(): unknown }>; set(r: unknown, d: unknown): unknown }) => {
        const d = (await tx.get(ref)).data() as { count?: number; window_start?: number } | undefined;
        const prev = d && typeof d.count === "number" && typeof d.window_start === "number" ? { count: d.count, windowStart: d.window_start } : undefined;
        const w = nextWindow(prev, windowMs, now);
        tx.set(ref, { count: w.count, window_start: w.windowStart, expire_at: new Date(w.windowStart + windowMs) });
        return w;
      });
    },
  };
}

// ── SQL (Postgres) ─────────────────────────────────────────────────────

/**
 * 매개변수 쿼리를 실행해 행 배열을 돌려주는 함수.
 * - Neon: `(text, params) => sql.query(text, params)`
 * - postgres.js: `(text, params) => sql.unsafe(text, params)`
 * - pg: `(text, params) => pool.query(text, params).then((r) => r.rows)`
 * - Prisma: `(text, params) => prisma.$queryRawUnsafe(text, ...params)`
 */
export type SqlQuery = (text: string, params: unknown[]) => Promise<readonly Record<string, unknown>[]>;

export interface SqlRateStoreOptions {
  /** 테이블 이름(스키마 포함 가능). 기본 `rate_limits` */
  table?: string;
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/;
function tableName(table = "rate_limits"): string {
  if (!IDENT.test(table)) throw new Error(`sqlRateStore: invalid table name ${JSON.stringify(table)}`);
  return table;
}

/** `sqlRateStore`가 쓰는 테이블. 마이그레이션에 넣는다. `expires_at`이 지난 행은 주기적으로 지워도 된다. */
export function rateLimitTableSql(table?: string): string {
  const t = tableName(table);
  return `CREATE TABLE IF NOT EXISTS ${t} (
  key          text PRIMARY KEY,
  count        integer NOT NULL,
  window_start bigint  NOT NULL,
  expires_at   bigint  NOT NULL
);
CREATE INDEX IF NOT EXISTS ${t.replace(".", "_")}_expires_at_idx ON ${t} (expires_at);`;
}

/** 한 문장 upsert로 원자적으로 센다(창이 지났으면 1로 다시 시작). */
export function sqlRateStore(query: SqlQuery, options: SqlRateStoreOptions = {}): RateStore {
  const t = tableName(options.table);
  const text = `INSERT INTO ${t} AS r (key, count, window_start, expires_at)
VALUES ($1, 1, $2::bigint, $2::bigint + $3::bigint)
ON CONFLICT (key) DO UPDATE SET
  count        = CASE WHEN $2::bigint - r.window_start >= $3::bigint THEN 1 ELSE r.count + 1 END,
  window_start = CASE WHEN $2::bigint - r.window_start >= $3::bigint THEN $2::bigint ELSE r.window_start END,
  expires_at   = CASE WHEN $2::bigint - r.window_start >= $3::bigint THEN $2::bigint + $3::bigint ELSE r.expires_at END
RETURNING count, window_start`;
  return {
    async increment(key, windowMs, now) {
      const rows = await query(text, [key, Math.trunc(now), Math.trunc(windowMs)]);
      const row = rows[0];
      if (!row) throw new Error("sqlRateStore: upsert returned no row");
      return { count: Number(row.count), windowStart: Number(row.window_start) };
    },
  };
}
