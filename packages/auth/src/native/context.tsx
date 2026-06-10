"use client";
/**
 * KitforgeAuthProvider — holds the device session, hydrated from secure storage
 * on launch. `useOAuth` writes to it after a successful sign-in; `useSession`
 * reads it anywhere in the app.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { expoSecureStorage, type SecureStorage } from "./storage.js";
import type { NativeSession } from "./config.js";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface KitforgeAuthContextValue {
  session: NativeSession | null;
  status: SessionStatus;
  /** Clear the session + stored tokens. */
  signOut: () => Promise<void>;
  /** Persist + activate a session (used internally by `useOAuth`). */
  setSession: (session: NativeSession) => Promise<void>;
}

const AuthContext = createContext<KitforgeAuthContextValue | null>(null);

const DEFAULT_KEY = "kitforge.auth.session";

export interface KitforgeAuthProviderProps {
  children: ReactNode;
  /** Storage backend. Defaults to expo-secure-store. */
  storage?: SecureStorage;
  /** Storage key for the persisted session. */
  storageKey?: string;
}

export function KitforgeAuthProvider({
  children,
  storage = expoSecureStorage,
  storageKey = DEFAULT_KEY,
}: KitforgeAuthProviderProps) {
  const [session, setSessionState] = useState<NativeSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  // Hydrate from secure storage on mount.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const raw = await storage.getItem(storageKey);
        if (!active) return;
        if (raw) {
          setSessionState(JSON.parse(raw) as NativeSession);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      } catch {
        if (active) setStatus("unauthenticated");
      }
    })();
    return () => {
      active = false;
    };
  }, [storage, storageKey]);

  const setSession = useCallback(
    async (next: NativeSession) => {
      await storage.setItem(storageKey, JSON.stringify(next));
      setSessionState(next);
      setStatus("authenticated");
    },
    [storage, storageKey],
  );

  const signOut = useCallback(async () => {
    await storage.removeItem(storageKey);
    setSessionState(null);
    setStatus("unauthenticated");
  }, [storage, storageKey]);

  return (
    <AuthContext.Provider value={{ session, status, signOut, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Internal: full context (throws outside the provider). */
export function useKitforgeAuthContext(): KitforgeAuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("[@kitforge/auth] useSession / useOAuth must be used inside <KitforgeAuthProvider>.");
  }
  return ctx;
}

export interface UseSessionResult {
  session: NativeSession | null;
  status: SessionStatus;
  signOut: () => Promise<void>;
}

/** Read the current device session. */
export function useSession(): UseSessionResult {
  const { session, status, signOut } = useKitforgeAuthContext();
  return { session, status, signOut };
}
