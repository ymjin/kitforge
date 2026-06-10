"use client";
/**
 * KitforgeProvider and SessionContext.
 *
 * "use client" makes this a Client Component in Next.js (required for React
 * hooks). In a pure SPA (Vite, CRA) the directive is a no-op string and is
 * safely ignored by the bundler.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "../node/types.js";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface SessionContextValue {
  session: Session | null;
  status: SessionStatus;
  /**
   * Manually re-fetch the session from the server.
   * Call this after performing an action that changes the session
   * (e.g. after updating profile data).
   */
  update: () => Promise<void>;
  /** The basePath this provider was configured with. */
  basePath: string;
}

export const SessionContext = createContext<SessionContextValue | null>(
  null as SessionContextValue | null,
);

export interface KitforgeProviderProps {
  /**
   * Must match the server adapter's `basePath`.
   * - Node adapter default: `"/auth"`
   * - Next.js adapter default: `"/api/auth"`
   */
  basePath?: string;
  /**
   * Re-fetch the session every N milliseconds (silent background refresh).
   * Default: `0` — disabled.
   * Recommended for long-running apps: `5 * 60 * 1000` (5 min).
   */
  refetchInterval?: number;
  /**
   * Re-fetch the session when the browser tab regains focus.
   * Default: `true`
   */
  refetchOnWindowFocus?: boolean;
  children: ReactNode;
}

/** Fetch current session from the server's `/session` endpoint. */
export async function fetchSession(basePath: string): Promise<Session | null> {
  try {
    const res = await fetch(`${basePath}/session`, {
      credentials: "include",        // send the HttpOnly session cookie
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as Session | null;
  } catch {
    // Network error (offline, CORS, etc.) — treat as no session
    return null;
  }
}

/**
 * Wrap your application (or a subtree) with this provider.
 *
 * ```tsx
 * // main.tsx / _app.tsx
 * <KitforgeProvider basePath="/api/auth">
 *   <App />
 * </KitforgeProvider>
 * ```
 */
export function KitforgeProvider({
  basePath = "/auth",
  refetchInterval = 0,
  refetchOnWindowFocus = true,
  children,
}: KitforgeProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus]   = useState<SessionStatus>("loading");
  const mounted = useRef(false);

  const update = useCallback(async () => {
    const data = await fetchSession(basePath);
    if (!mounted.current) return;
    setSession(data);
    setStatus(data ? "authenticated" : "unauthenticated");
  }, [basePath]);

  // Initial fetch on mount
  useEffect(() => {
    mounted.current = true;
    void update();
    return () => { mounted.current = false; };
  }, [update]);

  // Periodic silent refresh
  useEffect(() => {
    if (!refetchInterval) return;
    const id = setInterval(() => void update(), refetchInterval);
    return () => clearInterval(id);
  }, [refetchInterval, update]);

  // Refresh on window focus (catches session expiry while tab was hidden)
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    const onFocus = () => void update();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchOnWindowFocus, update]);

  return (
    <SessionContext.Provider value={{ session, status, update, basePath }}>
      {children}
    </SessionContext.Provider>
  );
}

/** Internal hook — throws if used outside <KitforgeProvider>. */
export function useKitforgeContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error(
      "[@kitforge/auth] useSession / useSignIn / useSignOut must be called " +
        "inside a <KitforgeProvider>.",
    );
  }
  return ctx;
}
