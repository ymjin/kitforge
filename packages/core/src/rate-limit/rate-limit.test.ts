import { describe, expect, it } from "vitest";
import {
  backoffVerdict,
  backoffWaitSeconds,
  clientIp,
  createRateLimiter,
  formatWait,
  memoryStore,
  rateKey,
  sha256Hex,
  type RateStore,
} from "./index.js";

const LIMIT = { name: "login", max: 3, windowMs: 60_000 };

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("createRateLimiter + memoryStore", () => {
  it("allows up to max per window, then reports retryAfter", async () => {
    const c = clock();
    const rl = createRateLimiter({ store: memoryStore(), now: c.now });
    expect(await rl.check(LIMIT, "a@x.com")).toEqual({ allowed: true, remaining: 2 });
    expect(await rl.check(LIMIT, "a@x.com")).toEqual({ allowed: true, remaining: 1 });
    expect(await rl.check(LIMIT, "a@x.com")).toEqual({ allowed: true, remaining: 0 });
    c.advance(20_000);
    expect(await rl.check(LIMIT, "a@x.com")).toEqual({ allowed: false, retryAfter: 40 });
  });

  it("starts a fresh window after windowMs", async () => {
    const c = clock();
    const rl = createRateLimiter({ store: memoryStore(), now: c.now });
    for (let i = 0; i < 4; i++) await rl.check(LIMIT, "ip");
    c.advance(60_000);
    expect(await rl.check(LIMIT, "ip")).toEqual({ allowed: true, remaining: 2 });
  });

  it("normalizes subject case and whitespace", async () => {
    const c = clock();
    const rl = createRateLimiter({ store: memoryStore(), now: c.now });
    await rl.check(LIMIT, "A@X.com");
    await rl.check(LIMIT, " a@x.com ");
    expect(await rl.check(LIMIT, "a@x.COM")).toEqual({ allowed: true, remaining: 0 });
  });

  it("keeps limits with different names apart", async () => {
    const rl = createRateLimiter({ store: memoryStore(), now: clock().now });
    for (let i = 0; i < 3; i++) await rl.check(LIMIT, "s");
    expect((await rl.check({ ...LIMIT, name: "search" }, "s")).allowed).toBe(true);
  });

  it("retryAfter is at least 1 second", async () => {
    const c = clock();
    const rl = createRateLimiter({ store: memoryStore(), now: c.now });
    for (let i = 0; i < 3; i++) await rl.check(LIMIT, "s");
    c.advance(59_999);
    expect(await rl.check(LIMIT, "s")).toEqual({ allowed: false, retryAfter: 1 });
  });

  it("hashes keys when asked, so the store never sees the raw subject", async () => {
    const seen: string[] = [];
    const inner = memoryStore();
    const spy: RateStore = { increment: (k, w, n) => (seen.push(k), inner.increment(k, w, n)) };
    const rl = createRateLimiter({ store: spy, hashKeys: true, now: clock().now });
    await rl.check(LIMIT, "a@x.com");
    expect(seen[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(seen[0]).toBe(await sha256Hex(rateKey(LIMIT, "a@x.com")));
  });

  it("works with an async store", async () => {
    const inner = memoryStore();
    const store: RateStore = { increment: async (k, w, n) => inner.increment(k, w, n) };
    const rl = createRateLimiter({ store, now: clock().now });
    expect(await rl.check(LIMIT, "s")).toEqual({ allowed: true, remaining: 2 });
  });
});

describe("memoryStore eviction", () => {
  it("drops the least recently used key past maxKeys", () => {
    const s = memoryStore({ maxKeys: 2 });
    s.increment("a", 1000, 0);
    s.increment("b", 1000, 0);
    s.increment("a", 1000, 1); // a is now most recent
    s.increment("c", 1000, 2); // evicts b
    expect(s.size()).toBe(2);
    expect(s.increment("b", 1000, 3).count).toBe(1);
    expect(s.increment("c", 1000, 3).count).toBe(2);
  });
});

describe("step backoff", () => {
  it("waits only when a tier is just reached", () => {
    expect(backoffWaitSeconds(4)).toBe(0);
    expect(backoffWaitSeconds(5)).toBe(60);
    expect(backoffWaitSeconds(6)).toBe(0);
    expect(backoffWaitSeconds(10)).toBe(300);
    expect(backoffWaitSeconds(15)).toBe(600);
    expect(backoffWaitSeconds(20)).toBe(3600);
    expect(backoffWaitSeconds(40)).toBe(3600);
  });
  it("verdict counts down from the last failure", () => {
    expect(backoffVerdict(5, 0, 30_000)).toEqual({ allowed: false, retryAfter: 30 });
    expect(backoffVerdict(5, 0, 60_000)).toEqual({ allowed: true });
    expect(backoffVerdict(5, null, 0)).toEqual({ allowed: true });
    expect(backoffVerdict(3, 0, 0)).toEqual({ allowed: true });
  });
  it("accepts a custom policy", () => {
    const p = { triesPerTier: 3, waitSeconds: [10] };
    expect(backoffWaitSeconds(3, p)).toBe(10);
    expect(backoffWaitSeconds(9, p)).toBe(10);
  });
  it("formatWait shows seconds under a minute, else rounded-up minutes", () => {
    expect(formatWait(30)).toBe("30초");
    expect(formatWait(0.2)).toBe("1초");
    expect(formatWait(60)).toBe("1분");
    expect(formatWait(61)).toBe("2분");
    expect(formatWait(3600)).toBe("60분");
  });
});

describe("clientIp", () => {
  it("reads the first x-forwarded-for hop from a Fetch Request", () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "1.1.1.1, 10.0.0.1" } });
    expect(clientIp(req)).toBe("1.1.1.1");
  });
  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIp(new Request("https://x.test", { headers: { "x-real-ip": " 2.2.2.2 " } }))).toBe("2.2.2.2");
    expect(clientIp(new Request("https://x.test"))).toBe("unknown");
  });
  it("accepts a Node/Express-style header object", () => {
    expect(clientIp({ headers: { "x-forwarded-for": "3.3.3.3" } })).toBe("3.3.3.3");
    expect(clientIp({ headers: { "x-forwarded-for": ["4.4.4.4, 5.5.5.5"] } })).toBe("4.4.4.4");
  });
});
