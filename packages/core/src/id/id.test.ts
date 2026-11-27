import { afterEach, describe, expect, it, vi } from "vitest";
import { newId, nowIso } from "./index.js";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe("newId", () => {
  it("returns a v4 UUID", () => {
    expect(newId()).toMatch(UUID_V4);
  });
  it("falls back to getRandomValues without randomUUID (Hermes)", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (a: Uint8Array) => real.getRandomValues(a) });
    expect(newId()).toMatch(UUID_V4);
  });
  it("falls back to Math.random without crypto", () => {
    vi.stubGlobal("crypto", undefined);
    const ids = new Set(Array.from({ length: 50 }, newId));
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(ids.size).toBe(50);
  });
});

describe("nowIso", () => {
  it("formats the given instant", () => {
    expect(nowIso(new Date(Date.UTC(2026, 10, 3, 6, 4, 5)))).toBe("2026-11-03T06:04:05.000Z");
  });
});
