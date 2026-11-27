/**
 * Cookie helpers built on the Web API Headers object.
 *
 * All auth cookies are HttpOnly + SameSite=Lax.
 * Session cookies also set Secure so they are only sent over HTTPS in
 * production.  OAuth state/PKCE cookies omit Secure so the flow works on
 * http://localhost during development.
 */

/** Cookie names — centralised so they never drift. */
export const COOKIE_SESSION  = "__kf_session";    // signed JWT, long-lived
export const COOKIE_STATE    = "__kf_state";       // OAuth CSRF token, ~10 min
export const COOKIE_PKCE     = "__kf_pkce";        // PKCE verifier,  ~10 min
export const COOKIE_PROVIDER = "__kf_provider";    // provider id,    ~10 min
export const COOKIE_REDIRECT = "__kf_redirect";    // post-login redirect URI, ~10 min

/** Read a single cookie value from a Request. */
export function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === name) return decodeURIComponent(part.slice(eqIdx + 1).trim());
  }
  return undefined;
}

export interface SetCookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  domain?: string;
}

/** Append a Set-Cookie header. Defaults to HttpOnly + SameSite=Lax. */
export function setCookie(
  headers: Headers,
  name: string,
  value: string,
  options: SetCookieOptions = {},
): void {
  const {
    maxAge,
    httpOnly = true,
    secure   = true,
    sameSite = "Lax",
    path     = "/",
    domain,
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) cookie += "; HttpOnly";
  if (secure)   cookie += "; Secure";
  if (domain)   cookie += `; Domain=${domain}`;
  if (maxAge !== undefined) cookie += `; Max-Age=${maxAge}`;

  headers.append("Set-Cookie", cookie);
}

/** Expire a cookie immediately (Max-Age=0).
 * `domain` must match the domain used when the cookie was set — otherwise the
 * browser treats it as a different cookie and the original is not cleared.
 */
export function clearCookie(headers: Headers, name: string, domain?: string): void {
  // Do NOT set Secure here so it clears on http:// as well.
  let cookie = `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
  if (domain) cookie += `; Domain=${domain}`;
  headers.append("Set-Cookie", cookie);
}
