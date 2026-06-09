/**
 * @kitforge/auth — framework-agnostic OAuth 2.0 core.
 *
 * This entry exposes the provider-neutral flow (authorize → exchange → refresh
 * → userinfo) and the shared types. Provider factories live in
 * `@kitforge/auth/providers`; framework bindings (Next.js, React) will live in
 * `@kitforge/auth/next` and `@kitforge/auth/react`.
 *
 * Security: this package never contains client secrets. Consumers inject them
 * from their own environment at construction time.
 */

export {
  createAuthorizationUrl,
  exchangeCode,
  refreshTokens,
  getUserInfo,
  OAuthError,
} from "./core/oauth.js";
export type {
  AuthorizationRequest,
  CreateAuthorizationUrlOptions,
  ExchangeCodeOptions,
  RefreshTokensOptions,
} from "./core/oauth.js";

export { createState, createCodeVerifier, createCodeChallenge } from "./core/pkce.js";

export type {
  NormalizedProfile,
  OAuthTokens,
  OAuthProvider,
  ProviderOptions,
} from "./core/types.js";
