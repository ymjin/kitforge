/**
 * @ymjin/auth/react — React SPA adapter.
 *
 * Provides Context + hooks for reading session state and triggering sign-in /
 * sign-out in a browser SPA (Vite, CRA, Next.js Client Components, etc.).
 *
 * The React adapter is purely client-side: it reads the session from the
 * server adapter's `/session` endpoint and redirects the browser to
 * `/signin/:provider`. All OAuth flows and session cookies are managed by the
 * server (`@ymjin/auth/node` or `@ymjin/auth/next`).
 *
 * ## Setup
 *
 * ```tsx
 * // main.tsx  (Vite SPA)
 * import { KitforgeProvider } from "@ymjin/auth/react";
 *
 * createRoot(document.getElementById("root")!).render(
 *   <KitforgeProvider basePath="/auth">
 *     <App />
 *   </KitforgeProvider>
 * );
 * ```
 *
 * ```tsx
 * // app/layout.tsx  (Next.js — wrap in a "use client" Client Component)
 * import { KitforgeProvider } from "@ymjin/auth/react";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html><body>
 *       <KitforgeProvider basePath="/api/auth">
 *         {children}
 *       </KitforgeProvider>
 *     </body></html>
 *   );
 * }
 * ```
 *
 * ## Hooks
 *
 * ```tsx
 * import { useSession, useSignIn, useSignOut } from "@ymjin/auth/react";
 *
 * function Navbar() {
 *   const { session, status } = useSession();
 *   const signIn  = useSignIn();
 *   const signOut = useSignOut();
 *
 *   if (status === "loading") return <Spinner />;
 *   if (status === "unauthenticated") {
 *     return (
 *       <>
 *         <button onClick={() => signIn("google")}>Google 로그인</button>
 *         <button onClick={() => signIn("kakao")}>카카오 로그인</button>
 *       </>
 *     );
 *   }
 *   return (
 *     <>
 *       <span>{session!.user.name}</span>
 *       <button onClick={() => signOut()}>로그아웃</button>
 *     </>
 *   );
 * }
 * ```
 */

// Provider + context
export {
  KitforgeProvider,
  SessionContext,
  useKitforgeContext,
  fetchSession,
} from "./context.js";
export type {
  KitforgeProviderProps,
  SessionContextValue,
  SessionStatus,
} from "./context.js";

// Hooks
export { useSession, useSignIn, useSignOut } from "./hooks.js";
export type { UseSessionResult, SignInOptions, SignOutOptions } from "./hooks.js";

// Re-export Session type so consumers don't need to import from core
export type { Session } from "../node/types.js";
