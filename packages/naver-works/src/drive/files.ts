import { getDriveBaseUrl, driveRequest, NaverWorksDriveError, WORKS_API_BASE } from "./client.js";
import type { DriveType } from "./client.js";

export interface DriveFile {
  fileId: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  createdTime?: string;
  modifiedTime?: string;
  downloadUrl?: string;
}

/**
 * 파일 업로드 (3단계: URL 발급 → PUT → 이동 확인)
 * @returns 업로드된 fileId
 */
export async function uploadFile(
  token: string,
  file: Buffer | Uint8Array,
  fileName: string,
  parentFolderId: string,
  driveType: DriveType = "personal",
  sharedDriveId?: string,
): Promise<string> {
  const baseUrl = getDriveBaseUrl(driveType, sharedDriveId);
  const fileSize = file instanceof Buffer ? file.length : file.byteLength;

  // 1단계: 업로드 URL 발급
  const metaRes = await driveRequest(
    `${baseUrl}/files/${parentFolderId}`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileSize }),
    },
  );
  const meta = (await metaRes.json()) as Record<string, unknown>;
  const uploadUrl = meta["uploadUrl"];
  if (typeof uploadUrl !== "string") {
    throw new NaverWorksDriveError("uploadUrl이 응답에 없습니다.", 0);
  }

  // 2단계: 파일 바이너리 PUT
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(file instanceof Buffer ? file : file),
  });
  if (!putRes.ok) {
    const body = await putRes.text().catch(() => "");
    throw new NaverWorksDriveError(`파일 업로드 실패 (${putRes.status})`, putRes.status, body);
  }

  const putJson = (await putRes.json()) as Record<string, unknown>;
  const uploadedFileId = putJson["fileId"];
  if (typeof uploadedFileId !== "string") {
    throw new NaverWorksDriveError("업로드 응답에서 fileId를 찾을 수 없습니다.", 0);
  }

  // 3단계: 이동 확인 (업로드 경로가 무시된 경우 fallback)
  try {
    const moveRes = await fetch(`${baseUrl}/files/${uploadedFileId}/move`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ toParentFileId: parentFolderId }),
    });
    if (moveRes.ok) {
      const moveJson = (await moveRes.json()) as Record<string, unknown>;
      const movedId = moveJson["fileId"] ?? moveJson["id"];
      if (typeof movedId === "string" && movedId !== uploadedFileId) {
        return movedId;
      }
    }
  } catch {
    // 이동 실패해도 업로드 자체는 성공 — uploadedFileId 반환
  }

  return uploadedFileId;
}

/**
 * 파일 다운로드 URL 조회
 */
export async function getDownloadUrl(
  token: string,
  fileId: string,
  driveType: DriveType = "personal",
  sharedDriveId?: string,
): Promise<string> {
  const baseUrl = getDriveBaseUrl(driveType, sharedDriveId);
  const res = await driveRequest(`${baseUrl}/files/${fileId}/content`, token);
  const json = (await res.json()) as Record<string, unknown>;
  const url = json["downloadUrl"] ?? json["url"];
  if (typeof url !== "string") {
    throw new NaverWorksDriveError("downloadUrl이 응답에 없습니다.", 0);
  }
  return url;
}

/**
 * 파일 삭제
 */
export async function deleteFile(
  token: string,
  fileId: string,
  driveType: DriveType = "personal",
  sharedDriveId?: string,
): Promise<void> {
  const baseUrl = getDriveBaseUrl(driveType, sharedDriveId);
  await driveRequest(`${baseUrl}/files/${fileId}`, token, { method: "DELETE" });
}

/**
 * 폴더 내 파일 목록 조회
 */
export async function listFiles(
  token: string,
  folderId: string = "root",
  driveType: DriveType = "personal",
  sharedDriveId?: string,
): Promise<DriveFile[]> {
  const baseUrl = getDriveBaseUrl(driveType, sharedDriveId);
  const res = await driveRequest(`${baseUrl}/files/${folderId}/files`, token);
  const json = (await res.json()) as Record<string, unknown>;
  const items = json["data"] ?? json["items"] ?? [];
  if (!Array.isArray(items)) return [];
  return items.map(normalizeFile);
}

function normalizeFile(raw: unknown): DriveFile {
  const r = raw as Record<string, unknown>;
  return {
    fileId: String(r["fileId"] ?? r["id"] ?? ""),
    fileName: String(r["fileName"] ?? r["name"] ?? ""),
    fileSize: typeof r["fileSize"] === "number" ? r["fileSize"] : undefined,
    mimeType: typeof r["mimeType"] === "string" ? r["mimeType"] : undefined,
    createdTime: typeof r["createdTime"] === "string" ? r["createdTime"] : undefined,
    modifiedTime: typeof r["modifiedTime"] === "string" ? r["modifiedTime"] : undefined,
    downloadUrl: typeof r["downloadUrl"] === "string" ? r["downloadUrl"] : undefined,
  };
}
