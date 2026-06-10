/**
 * @kitforge/auth/native — React Native (Expo) auth.
 *
 * A native sign-in flow (expo-auth-session + expo-secure-store) that shares the
 * SAME data as the web build: provider configs from `@kitforge/auth/providers`,
 * the `getUserInfo` profile fetch, and the `NormalizedProfile` shape. The flow
 * is separate; the data is one source of truth — so a Google user is identical
 * on web and native.
 *
 * ```tsx
 * // App root
 * import { KitforgeAuthProvider } from "@kitforge/auth/native";
 * <KitforgeAuthProvider><App /></KitforgeAuthProvider>
 *
 * // A screen
 * import { Google } from "@kitforge/auth/providers";
 * import { useOAuth, useSession } from "@kitforge/auth/native";
 *
 * const google = Google({ clientId: GOOGLE_CLIENT_ID });
 * const { signIn } = useOAuth(google);
 * const { session, signOut } = useSession();
 * ```
 *
 * Requires `expo-auth-session` + `expo-secure-store` (peer deps) and an app URL
 * scheme. Naver is web-only (needs a client secret → backend exchange).
 */

export { KitforgeAuthProvider, useSession, useKitforgeAuthContext } from "./context.js";
export type {
  KitforgeAuthProviderProps,
  KitforgeAuthContextValue,
  UseSessionResult,
  SessionStatus,
} from "./context.js";

export { useOAuth } from "./useOAuth.js";
export type { UseOAuthOptions, UseOAuthResult } from "./useOAuth.js";

export { expoSecureStorage } from "./storage.js";
export type { SecureStorage } from "./storage.js";

export { profileToSessionUser, providerDiscovery, toOAuthTokens } from "./config.js";
export type { NativeSession } from "./config.js";

// Shared core types, for convenience.
export type { NormalizedProfile, OAuthTokens, SessionUser } from "../core/types.js";
