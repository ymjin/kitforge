import { createSign, createPrivateKey } from "crypto";
import type { NaverWorksConfig, NaverWorksTokenAdapter } from "./types.js";

const TOKEN_ENDPOINT = "https://auth.worksmobile.com/oauth2/v2.0/token";
const DEFAULT_SCOPES = "bot,calendar,directory.read,user.read";
const BUFFER_MS = 5 * 60 * 1000;

/**
 * 서비스 계정 access_token 반환.
 * adapter에 캐시가 있으면 재사용, 만료 임박 시 새로 발급.
 */
export async function getServiceAccountToken(
  config: NaverWorksConfig,
  adapter: NaverWorksTokenAdapter,
): Promise<string | null> {
  if (!config.serviceAccount) return null;

  // 캐시 조회
  if (adapter.getSAToken) {
    const cached = await adapter.getSAToken();
    if (cached) {
      const expiresAt = new Date(cached.expiresAt).getTime();
      if (expiresAt - Date.now() > BUFFER_MS) {
        return cached.token;
      }
    }
  }

  // 새 토큰 발급
  try {
    const { id, privateKey, scopes } = config.serviceAccount;
    const jwt = createJWT(config.clientId, id, privateKey);

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      assertion: jwt,
      scope: scopes ?? DEFAULT_SCOPES,
    });

    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[naver-works/sa] 토큰 발급 실패: ${res.status} ${text}`);
      return null;
    }

    const json = (await res.json()) as Record<string, unknown>;
    if (json["error"]) {
      console.error(`[naver-works/sa] 토큰 발급 오류: ${String(json["error"])}`);
      return null;
    }

    const expiresIn = typeof json["expires_in"] === "number" ? json["expires_in"] : 3600;
    const token = String(json["access_token"]);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    if (adapter.saveSAToken) {
      await adapter.saveSAToken(token, expiresAt);
    }

    return token;
  } catch (err) {
    console.error("[naver-works/sa] 예외:", err);
    return null;
  }
}

/** RS256 JWT 생성 */
function createJWT(clientId: string, serviceAccountId: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ iss: clientId, sub: serviceAccountId, iat: now, exp: now + 3600 }),
  );

  const signingInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);

  const pem = normalizePem(privateKeyPem);
  let privateKey;
  try {
    privateKey = createPrivateKey(pem);
  } catch {
    const pkcs1 = pem
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN RSA PRIVATE KEY-----")
      .replace("-----END PRIVATE KEY-----", "-----END RSA PRIVATE KEY-----");
    privateKey = createPrivateKey(pkcs1);
  }

  const signature = sign
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signature}`;
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** PEM 정규화: BOM 제거, \\n 이스케이프 처리, 64자 단위 줄바꿈 */
function normalizePem(raw: string): string {
  let pem = raw
    .replace(/^﻿/, "")   // BOM
    .replace(/\\n/g, "\n")    // 리터럴 \n → 실제 개행
    .replace(/\r/g, "")
    .trim();

  const match = pem.match(/(-----BEGIN [^-]+-----)([\s\S]*?)(-----END [^-]+-----)/);
  if (match) {
    const [, hdr, body, ftr] = match;
    const clean = body!.replace(/[^A-Za-z0-9+/=]/g, "");
    const lines = clean.match(/.{1,64}/g) ?? [];
    pem = [hdr, ...lines, ftr].join("\n");
  }

  return pem;
}
