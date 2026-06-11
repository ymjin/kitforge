"use client";
/**
 * useOAuth — run a provider's sign-in flow with expo-auth-session, then store
 * the resulting session.
 *
 * The flow (system browser → deep-link redirect → PKCE code exchange) is
 * entirely native; only the *data* is shared with the web build — the provider
 * config (`@ymjin/auth/providers`), the `getUserInfo` profile fetch, and the
 * `NormalizedProfile` shape. So a Google user is identical across platforms.
 *
 * Works for any standard PKCE provider (Google, Kakao). Apple is better served
 * by `expo-apple-authentication` (native sheet) — a separate follow-up.
 *
 * ```tsx
 * import { Google } from "@ymjin/auth/providers";
 * import { useOAuth } from "@ymjin/auth/native";
 *
 * const google = Google({ clientId: GOOGLE_CLIENT_ID });
 * function LoginScreen() {
 *   const { signIn, isReady } = useOAuth(google);
 *   return <Button disabled={!isReady} onPress={() => signIn()} title="Google 로그인" />;
 * }
 * ```
 */

import { useCallback } from "react";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import { getUserInfo } from "../core/oauth.js";
import type { OAuthProvider } from "../core/types.js";
import {
  profileToSessionUser,
  providerDiscovery,
  toOAuthTokens,
  type NativeSession,
} from "./config.js";
import { useKitforgeAuthContext } from "./context.js";

export interface UseOAuthOptions {
  /**
   * Deep-link redirect URI. Defaults to `makeRedirectUri()` (your app scheme).
   * Must match the redirect registered in the provider console.
   */
  redirectUri?: string;
  /** Override the provider's default scopes. */
  scopes?: string[];
}

export interface UseOAuthResult {
  /** Launch the sign-in flow; resolves with the new session, or null if cancelled. */
  signIn: () => Promise<NativeSession | null>;
  /** Whether the auth request is initialized (needed before `signIn`). */
  isReady: boolean;
}

export function useOAuth(provider: OAuthProvider, options: UseOAuthOptions = {}): UseOAuthResult {
  const { setSession } = useKitforgeAuthContext();
  const discovery = providerDiscovery(provider);
  const redirectUri = options.redirectUri ?? makeRedirectUri();

  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: provider.clientId,
      scopes: options.scopes ?? provider.scopes,
      redirectUri,
      responseType: "code",
      usePKCE: true,
      extraParams: provider.authorization.params,
    },
    discovery,
  );

  const signIn = useCallback(async (): Promise<NativeSession | null> => {
    const result = await promptAsync();
    if (result.type === "cancel" || result.type === "dismiss") return null;
    if (result.type !== "success" || !result.params["code"]) {
      throw new Error(
        `[@ymjin/auth] ${provider.id} sign-in failed: ${result.error?.message ?? result.type}`,
      );
    }

    const tokenResponse = await exchangeCodeAsync(
      {
        clientId: provider.clientId,
        code: result.params["code"],
        redirectUri,
        extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      },
      discovery,
    );

    const tokens = toOAuthTokens(tokenResponse);
    const profile = await getUserInfo(provider, tokens.accessToken, tokens);
    const session: NativeSession = { user: profileToSessionUser(profile), tokens };
    await setSession(session);
    return session;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptAsync, request, redirectUri, provider]);

  return { signIn, isReady: request != null };
}
