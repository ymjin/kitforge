import { describe, expect, it } from "vitest";
import type { OAuthProvider } from "../core/types.js";
import { profileToSessionUser, providerDiscovery, toOAuthTokens } from "./config.js";

describe("toOAuthTokens", () => {
  it("maps fields and computes expiry from issuedAt", () => {
    const t = toOAuthTokens({ accessToken: "a", refreshToken: "r", expiresIn: 3600, issuedAt: 1_700_000_000 });
    expect(t.accessToken).toBe("a");
    expect(t.tokenType).toBe("Bearer");
    expect(t.refreshToken).toBe("r");
    expect(t.expiresAt).toBe((1_700_000_000 + 3600) * 1000);
  });

  it("omits expiry when expiresIn is absent", () => {
    expect(toOAuthTokens({ accessToken: "a" }).expiresAt).toBeUndefined();
  });
});

describe("profileToSessionUser", () => {
  it("narrows a profile to the session user", () => {
    const user = profileToSessionUser({
      provider: "google",
      id: "x",
      email: "e@x.com",
      name: "n",
      avatarUrl: "u",
      raw: {},
    });
    expect(user).toEqual({ id: "x", provider: "google", email: "e@x.com", name: "n", avatarUrl: "u" });
  });
});

describe("providerDiscovery", () => {
  it("derives endpoints from the provider config", () => {
    const provider = {
      authorization: { url: "https://auth" },
      token: { url: "https://token" },
    } as OAuthProvider;
    expect(providerDiscovery(provider)).toEqual({
      authorizationEndpoint: "https://auth",
      tokenEndpoint: "https://token",
    });
  });
});
