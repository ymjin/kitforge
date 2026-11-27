/**
 * 겹치지 않는 ID(UUID v4)와 저장 시각.
 * Hermes(React Native)에는 `crypto.randomUUID`가 없을 수 있어 `getRandomValues` → `Math.random` 순으로 대신한다.
 * ⚠️ 보안 토큰 용도가 아니다 — 기기 · 서버에서 겹치지 않는 이름이면 되는 곳에 쓴다.
 */

type CryptoLike = { randomUUID?: () => string; getRandomValues?: (a: Uint8Array) => Uint8Array };

export function newId(): string {
  const c = (globalThis as { crypto?: CryptoLike }).crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  if (typeof c?.getRandomValues === "function") c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** 지금 시각 ISO 문자열(UTC). */
export const nowIso = (now: Date = new Date()) => now.toISOString();
