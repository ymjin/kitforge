---
"@kitforge/auth": minor
---

Add `@kitforge/auth` with a framework-agnostic OAuth 2.0 + PKCE core and the
Google provider. Exposes `createAuthorizationUrl`, `exchangeCode`,
`refreshTokens`, and `getUserInfo` from the root, and the `Google` factory from
`@kitforge/auth/providers`. Client secrets are injected by the consumer and
never bundled.
