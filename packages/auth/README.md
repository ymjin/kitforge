# @ymjin/auth

Framework-agnostic social-login (OAuth 2.0 + PKCE) core for kitforge.

- **Today:** Google
- **Next:** Kakao, Naver, then Apple
- **Adapters (planned):** `@ymjin/auth/next`, `@ymjin/auth/react`

## Design

One provider-neutral flow handles every provider. A provider is just a config
object (endpoints + a profile mapper) built by a factory, so adding Kakao/Naver/Apple
touches only `src/providers/` — the core never changes.

```
src/
├─ core/
│  ├─ types.ts    ← OAuthProvider, OAuthTokens, NormalizedProfile
│  ├─ pkce.ts     ← state + PKCE (Web Crypto, runs in browser & Node 18+)
│  └─ oauth.ts    ← authorize → exchange → refresh → userinfo
└─ providers/
   └─ google.ts   ← Google factory
```

## Security

This package **never contains client secrets.** You inject them from your own
environment. A Google `clientId` is public and safe to ship; the `clientSecret`
(server flow only) comes from your `.env`. SPA clients omit the secret entirely
and rely on PKCE.

## Usage (low-level core)

```ts
import { createAuthorizationUrl, exchangeCode, getUserInfo } from "@ymjin/auth";
import { Google } from "@ymjin/auth/providers";

const google = Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // omit for SPA
});

// 1. Send the user to Google. Persist `state` + `codeVerifier` (cookie/session).
const { url, state, codeVerifier } = await createAuthorizationUrl(google, {
  redirectUri: "https://app.example.com/auth/callback",
});

// 2. In your callback handler, after verifying `state`:
const tokens = await exchangeCode(google, { code, codeVerifier, redirectUri });

// 3. Load the normalized profile.
const profile = await getUserInfo(google, tokens.accessToken);
// → { provider: "google", id, email, name, avatarUrl, raw }
```

Higher-level `signIn` / `signOut` / session helpers arrive with the framework
adapters.
