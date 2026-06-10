"use client";
/**
 * React hooks for reading session state and triggering auth actions.
 *
 * All hooks must be used inside a <KitforgeProvider>.
 */

import { useCallback } from "react";
import { useKitforgeContext, type SessionStatus } from "./context.js";
import type { Session } from "../node/types.js";

// ── useSession ────────────────────────────────────────────────────────────

export interface UseSessionResult {
  /** The current session, or `null` when unauthenticated / loading. */
  session: Session | null;
  /** `"loading"` on first render, then `"authenticated"` or `"unauthenticated"`. */
  status: SessionStatus;
  /** Manually re-fetch the session (e.g. after a profile update). */
  update: () => Promise<void>;
}

/**
 * Read the current session and its loading state.
 *
 * ```tsx
 * const { session, status } = useSession();
 * if (status === "loading") return <Spinner />;
 * if (status === "unauthenticated") return <LoginButton />;
 * return <p>Hello, {session!.user.name}</p>;
 * ```
 */
export function useSession(): UseSessionResult {
  const { session, status, update } = useKitforgeContext();
  return { session, status, update };
}

// ── useSignIn ─────────────────────────────────────────────────────────────

export interface SignInOptions {
  /**
   * Where the server should redirect the user after a successful sign-in.
   * The node/next adapter forwards this as a query parameter to the
   * sign-in endpoint.
   */
  redirectTo?: string;
}

/**
 * Returns a `signIn(providerId)` function that redirects the browser to the
 * provider's authorization page. The server adapter handles the rest.
 *
 * ```tsx
 * const signIn = useSignIn();
 * <button onClick={() => signIn("google")}>Google로 로그인</button>
 * <button onClick={() => signIn("kakao")}>카카오로 로그인</button>
 * ```
 */
export function useSignIn() {
  const { basePath } = useKitforgeContext();

  return useCallback(
    (providerId: string, options?: SignInOptions) => {
      let url = `${basePath}/signin/${providerId}`;
      if (options?.redirectTo) {
        url += `?redirectTo=${encodeURIComponent(options.redirectTo)}`;
      }
      window.location.href = url;
    },
    [basePath],
  );
}

// ── useSignOut ────────────────────────────────────────────────────────────

export interface SignOutOptions {
  /** Where to navigate after sign-out. Default: `"/"` */
  redirectTo?: string;
}

/**
 * Returns an async `signOut()` function that:
 * 1. POSTs to `{basePath}/signout` to clear the HttpOnly session cookie.
 * 2. Updates the local session state to `"unauthenticated"`.
 * 3. Navigates to `redirectTo` (default `"/"`).
 *
 * ```tsx
 * const signOut = useSignOut();
 * <button onClick={() => signOut()}>로그아웃</button>
 * <button onClick={() => signOut({ redirectTo: "/goodbye" })}>로그아웃</button>
 * ```
 */
export function useSignOut() {
  const { basePath, update } = useKitforgeContext();

  return useCallback(
    async (options?: SignOutOptions) => {
      try {
        await fetch(`${basePath}/signout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Network failure — clear local state anyway
      }
      // Sync local state before navigation so any in-tree listeners see it
      await update();
      window.location.href = options?.redirectTo ?? "/";
    },
    [basePath, update],
  );
}
