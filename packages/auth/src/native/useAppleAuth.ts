"use client";
/**
 * useAppleAuth — native Sign in with Apple via the system sheet
 * (`expo-apple-authentication`), not the OAuth/PKCE browser flow.
 *
 * Apple returns a signed `identityToken` (id_token) directly — no code
 * exchange. The profile is built from the credential and mapped with the SAME
 * `mapAppleClaims` the web flow uses, so an Apple user is identical across
 * platforms. The `identityToken` is stored for your backend to verify.
 *
 * `email`/`fullName` arrive only on the FIRST sign-in — the session persists
 * them so later launches still have a name.
 *
 * ```tsx
 * import { useAppleAuth } from "@ymjin/auth/native";
 *
 * const { signIn, isAvailable } = useAppleAuth();
 * {isAvailable && <Button title="Apple로 로그인" onPress={() => signIn()} />}
 * ```
 *
 * Required: `expo-apple-authentication` (peer), iOS with "Sign in with Apple"
 * capability enabled. `isAvailable` is false on Android / unsupported devices.
 */

import { useCallback, useEffect, useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { mapAppleClaims } from "../providers/apple.js";
import { profileToSessionUser, type NativeSession } from "./config.js";
import { useKitforgeAuthContext } from "./context.js";

export interface UseAppleAuthResult {
  /** Launch the native Apple sheet; resolves with the session, or null if cancelled. */
  signIn: () => Promise<NativeSession | null>;
  /** Whether Apple sign-in is available (iOS 13+ with the capability). */
  isAvailable: boolean;
}

export function useAppleAuth(): UseAppleAuthResult {
  const { setSession } = useKitforgeAuthContext();
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    AppleAuthentication.isAvailableAsync()
      .then((v) => {
        if (active) setIsAvailable(v);
      })
      .catch(() => {
        if (active) setIsAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (): Promise<NativeSession | null> => {
    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
    } catch (err) {
      // User dismissed the sheet.
      if ((err as { code?: string })?.code === "ERR_REQUEST_CANCELED") return null;
      throw err;
    }

    if (!credential.identityToken) {
      throw new Error("[@ymjin/auth] Apple sign-in returned no identityToken.");
    }

    const name = joinName(credential.fullName);
    // Build claims from the credential (credential.user IS the id_token `sub`),
    // then map with the shared Apple mapper for a consistent profile shape.
    const profile = mapAppleClaims(
      {
        sub: credential.user,
        email: credential.email ?? undefined,
        // Apple-issued emails are verified by Apple.
        email_verified: credential.email ? "true" : undefined,
      },
      { name },
    );

    const session: NativeSession = {
      user: profileToSessionUser(profile),
      tokens: {
        // Apple native has no bearer access token; the id_token is the credential.
        accessToken: credential.identityToken,
        tokenType: "Bearer",
        idToken: credential.identityToken,
      },
    };
    await setSession(session);
    return session;
  }, [setSession]);

  return { signIn, isAvailable };
}

function joinName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | undefined {
  if (!fullName) return undefined;
  const joined = [fullName.givenName, fullName.familyName].filter(Boolean).join(" ").trim();
  return joined.length > 0 ? joined : undefined;
}
