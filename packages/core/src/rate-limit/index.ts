/**
 * 레이트 리밋 — 고정 창(fixed window) 카운터와 점증 대기(step backoff).
 *
 * 저장은 강제하지 않는다. `RateStore`를 구현해 주입한다(Firestore 트랜잭션 · Postgres upsert · Redis INCR …).
 * 기본 제공은 `memoryStore()` — 함수 인스턴스 메모리에만 두므로 인스턴스마다 따로 센다
 * (완벽한 차단이 아니라 한 곳에서 몰아치는 요청을 늦추는 용도).
 *
 * ⭐ 서버리스에서는 `sleep`으로 기다리게 하지 말고 `429 + Retry-After`로 돌려준다 — 대기는 실행 시간(비용)이다.
 * ⚠️ 이메일 · IP 원문을 저장소에 남기지 않으려면 `hashKeys: true`(SHA-256, Web Crypto).
 */

export interface RateLimit {
  /** 저장 키 접두어 — 한도마다 다르게 */
  name: string;
  /** 창 안에서 허용하는 횟수 */
  max: number;
  windowMs: number;
}

export type RateVerdict =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number };

export interface RateWindow {
  count: number;
  /** 이 창이 시작된 시각(ms) */
  windowStart: number;
}

export interface RateStore {
  /**
   * `key`의 카운트를 1 올린다. 창(`windowMs`)이 지났으면 새 창으로 시작한다(`count: 1, windowStart: now`).
   * **원자적이어야 한다**(여러 인스턴스가 같은 키를 동시에 올려도 빠지지 않게).
   */
  increment(key: string, windowMs: number, now: number): Promise<RateWindow> | RateWindow;
}

export interface RateLimiterOptions {
  store: RateStore;
  /** 키를 SHA-256 hex로 바꿔 저장한다. 기본 false. */
  hashKeys?: boolean;
  /** 시각 주입(테스트). 기본 `Date.now`. */
  now?: () => number;
}

export interface RateLimiter {
  /** 한 번 센다. 한도를 넘었으면 `{ allowed: false, retryAfter }`(초). */
  check(limit: RateLimit, subject: string): Promise<RateVerdict>;
}

/** `name:subject` — subject는 앞뒤 공백을 지우고 소문자로(이메일 대소문자 우회 방지). */
export const rateKey = (limit: RateLimit, subject: string) => `${limit.name}:${subject.trim().toLowerCase()}`;

/** SHA-256 hex (Web Crypto — Node 18+ · 브라우저 · edge). */
export async function sha256Hex(text: string): Promise<string> {
  const subtle = (globalThis as { crypto?: Crypto }).crypto?.subtle;
  if (!subtle) throw new Error("sha256Hex: Web Crypto (crypto.subtle) is not available in this runtime");
  const buf = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const now = options.now ?? Date.now;
  return {
    async check(limit, subject) {
      const raw = rateKey(limit, subject);
      const key = options.hashKeys ? await sha256Hex(raw) : raw;
      const t = now();
      const w = await options.store.increment(key, limit.windowMs, t);
      if (w.count > limit.max) {
        return { allowed: false, retryAfter: Math.max(1, Math.ceil((w.windowStart + limit.windowMs - t) / 1000)) };
      }
      return { allowed: true, remaining: limit.max - w.count };
    },
  };
}

/**
 * 프로세스 메모리 저장소. `maxKeys`를 넘으면 가장 오래 안 쓴 키부터 지운다.
 * ⚠️ 서버리스 · 여러 인스턴스에서는 인스턴스마다 따로 센다.
 */
export function memoryStore(options: { maxKeys?: number } = {}): RateStore & { size(): number; clear(): void } {
  const maxKeys = options.maxKeys ?? 5_000;
  const windows = new Map<string, RateWindow>();
  return {
    increment(key, windowMs, now) {
      const prev = windows.get(key);
      const w: RateWindow =
        !prev || now - prev.windowStart >= windowMs ? { count: 1, windowStart: now } : { count: prev.count + 1, windowStart: prev.windowStart };
      windows.delete(key); // 다시 넣어 「최근 사용」 순서로
      windows.set(key, w);
      while (windows.size > maxKeys) windows.delete(windows.keys().next().value!);
      return w;
    },
    size: () => windows.size,
    clear: () => windows.clear(),
  };
}

// ── 점증 대기 (로그인 실패 등) ─────────────────────────────────────────────

/**
 * 실패 `triesPerTier`회마다 한 단계씩 오른다. 단계에 막 닿은 순간(5 · 10 · 15 …회째 실패 직후)에만
 * 기다리게 하고, 기다림이 끝나면 다음 단계까지는 바로 시도할 수 있다. 마지막 단계가 상한.
 *
 * ⭐ 계정을 잠그지 않는다 — 관리자 계정이 하나인 서비스에서 잠금은 곧 서비스 잠금이고,
 *   공격자가 일부러 틀려 운영자를 밖에 세울 수 있다. 📌 분산 IP(봇넷)는 막지 못한다.
 */
export interface BackoffPolicy {
  triesPerTier: number;
  /** 단계별 대기(초). 기본 5회째 1분 → 10회째 5분 → 15회째 10분 → 20회째 이후 1시간 */
  waitSeconds: readonly number[];
}

export const DEFAULT_BACKOFF: BackoffPolicy = { triesPerTier: 5, waitSeconds: [60, 300, 600, 3600] };

/** 실패가 `fails`번 쌓였을 때 다음 시도 전에 기다려야 하는 초. 0이면 바로. */
export function backoffWaitSeconds(fails: number, policy: BackoffPolicy = DEFAULT_BACKOFF): number {
  const { triesPerTier: n, waitSeconds } = policy;
  if (fails < n || fails % n !== 0 || waitSeconds.length === 0) return 0;
  const tier = Math.min(fails / n, waitSeconds.length) - 1;
  return waitSeconds[tier]!;
}

/** 실패 수 · 마지막 실패 시각(ms)으로 지금 시도해도 되는지. */
export function backoffVerdict(
  fails: number,
  lastFailAt: number | null,
  now: number,
  policy: BackoffPolicy = DEFAULT_BACKOFF,
): { allowed: true } | { allowed: false; retryAfter: number } {
  const wait = backoffWaitSeconds(fails, policy);
  if (wait === 0 || lastFailAt === null) return { allowed: true };
  const elapsed = (now - lastFailAt) / 1000;
  if (elapsed >= wait) return { allowed: true };
  return { allowed: false, retryAfter: Math.ceil(wait - elapsed) };
}

/** 남은 대기를 안내 문구용으로 — 60초 미만은 `N초`, 그 이상은 올림한 `N분`. */
export const formatWait = (retryAfterSec: number) =>
  retryAfterSec < 60 ? `${Math.max(1, Math.ceil(retryAfterSec))}초` : `${Math.ceil(retryAfterSec / 60)}분`;

// ── 요청 주체 ────────────────────────────────────────────────────────────

type HeaderBag =
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>;

function header(headers: HeaderBag, name: string): string | undefined {
  if (typeof (headers as { get?: unknown }).get === "function") {
    return (headers as { get(name: string): string | null }).get(name) ?? undefined;
  }
  const v = (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * 프록시(Vercel · API Gateway · Cloudflare) 뒤에서 원래 접속 IP. 없으면 `'unknown'`으로 묶어 센다.
 * Fetch `Request`와 Node/Express의 `req`(헤더 객체) 둘 다 받는다.
 */
export function clientIp(source: { headers: HeaderBag }): string {
  const xff = header(source.headers, "x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  if (first) return first;
  return header(source.headers, "x-real-ip")?.trim() || "unknown";
}
