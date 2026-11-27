import type { NaverWorksConfig, NaverWorksTokenAdapter, StoredToken } from "./types.js";

const TOKEN_ENDPOINT = "https://auth.worksmobile.com/oauth2/v2.0/token";
const BUFFER_MS = 5 * 60 * 1000; // 만료 5분 전 갱신

/**
 * 유저 OAuth access_token 반환.
 * 만료 5분 전이면 refresh_token으로 자동 갱신 후 adapter에 저장.
 */
export async function getValidOAuthToken(
  userId: string,
  config: NaverWorksConfig,
  adapter: NaverWorksTokenAdapter,
): Promise<string | null> {
  const stored = await adapter.getToken(userId);
  if (!stored) return null;

  const expiresAt = new Date(stored.expiresAt).getTime();
  if (expiresAt - Date.now() > BUFFER_MS) {
    return stored.accessToken;
  }

  if (!stored.refreshToken) return null;

  const newToken = await refreshOAuthToken(stored.refreshToken, config);
  if (!newToken) return null;

  await adapter.saveToken(userId, newToken);
  return newToken.accessToken;
}

/** refresh_token으로 새 토큰 발급 */
async function refreshOAuthToken(
  refreshToken: string,
  config: NaverWorksConfig,
): Promise<StoredToken | null> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });

  try {
    const res = await fetchWithRetry(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      console.error(`[naver-works/token] OAuth refresh 실패: ${res.status}`);
      return null;
    }

    const json = (await res.json()) as Record<string, unknown>;
    if (json["error"]) {
      console.error(`[naver-works/token] OAuth refresh 오류: ${String(json["error"])}`);
      return null;
    }

    const expiresIn = typeof json["expires_in"] === "number" ? json["expires_in"] : 3600;
    return {
      accessToken: String(json["access_token"]),
      refreshToken: typeof json["refresh_token"] === "string" ? json["refresh_token"] : refreshToken,
      idToken: typeof json["id_token"] === "string" ? json["id_token"] : null,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  } catch (err) {
    console.error("[naver-works/token] OAuth refresh 예외:", err);
    return null;
  }
}

/** 지수 백오프 재시도 fetch (최대 3회) */
async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500) return res; // 4xx는 재시도 불필요
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, 2 ** i * 500));
    }
  }
  throw lastErr;
}
