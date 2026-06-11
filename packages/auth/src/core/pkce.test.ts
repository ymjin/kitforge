import { describe, expect, it } from "vitest";
import { createCodeChallenge, createCodeVerifier, createState } from "./pkce.js";

describe("pkce", () => {
  it("createState is url-safe and high-entropy", () => {
    const s = createState();
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(s.length).toBeGreaterThan(20);
  });

  it("createCodeVerifier returns unique values", () => {
    expect(createCodeVerifier()).not.toBe(createCodeVerifier());
  });

  it("createCodeChallenge derives a url-safe S256 hash distinct from the verifier", async () => {
    const verifier = createCodeVerifier();
    const challenge = await createCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).not.toBe(verifier);
    // Deterministic for the same verifier.
    expect(await createCodeChallenge(verifier)).toBe(challenge);
  });
});
