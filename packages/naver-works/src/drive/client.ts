export const WORKS_API_BASE = "https://www.worksapis.com/v1.0";

export type DriveType = "personal" | "shared";

export class NaverWorksAuthError extends Error {
  constructor(message = "Naver Works 토큰이 없습니다. 재로그인이 필요합니다.") {
    super(message);
    this.name = "NaverWorksAuthError";
  }
}

export class NaverWorksDriveError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "NaverWorksDriveError";
  }
}

export function isNaverWorksAuthError(err: unknown): err is NaverWorksAuthError {
  return err instanceof NaverWorksAuthError;
}

export function getDriveBaseUrl(driveType: DriveType, sharedDriveId?: string): string {
  if (driveType === "shared" && sharedDriveId) {
    return `${WORKS_API_BASE}/sharedrives/${sharedDriveId}`;
  }
  return `${WORKS_API_BASE}/users/me/drive`;
}

export async function driveRequest(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit | undefined);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NaverWorksDriveError(
      `Naver Works Drive 요청 실패 (${res.status}): ${url}`,
      res.status,
      body,
    );
  }
  return res;
}
