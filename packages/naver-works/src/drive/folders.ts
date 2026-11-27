import { getDriveBaseUrl, driveRequest } from "./client.js";
import type { DriveType } from "./client.js";

export interface DriveFolder {
  folderId: string;
  folderName: string;
  parentFolderId?: string;
}

/**
 * 폴더 생성. 이미 존재하면(409) 기존 폴더 ID 반환.
 */
export async function createFolder(
  token: string,
  folderName: string,
  parentFolderId: string = "root",
  driveType: DriveType = "personal",
  sharedDriveId?: string,
): Promise<string> {
  const baseUrl = getDriveBaseUrl(driveType, sharedDriveId);
  const url = `${baseUrl}/files/${parentFolderId}/createfolder`;

  try {
    const res = await driveRequest(url, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: folderName.trim() }),
    });
    const json = (await res.json()) as Record<string, unknown>;
    return String(json["fileId"] ?? json["id"] ?? "");
  } catch (err: unknown) {
    // 409 이미 존재 → 기존 ID 조회
    if (
      err instanceof Error &&
      err.name === "NaverWorksDriveError" &&
      (err as { status?: number }).status === 409
    ) {
      const existing = await findFolderByName(
        token,
        folderName,
        parentFolderId,
        driveType,
        sharedDriveId,
      );
      if (existing) return existing;
    }
    throw err;
  }
}

/**
 * 이름으로 폴더 검색 (부모 폴더 내)
 */
export async function findFolderByName(
  token: string,
  folderName: string,
  parentFolderId: string = "root",
  driveType: DriveType = "personal",
  sharedDriveId?: string,
): Promise<string | null> {
  const baseUrl = getDriveBaseUrl(driveType, sharedDriveId);
  try {
    const res = await driveRequest(`${baseUrl}/files/${parentFolderId}/files`, token);
    const json = (await res.json()) as Record<string, unknown>;
    const items = json["data"] ?? json["items"] ?? [];
    if (!Array.isArray(items)) return null;
    const found = items.find(
      (item: unknown) =>
        (item as Record<string, unknown>)["fileName"] === folderName &&
        (item as Record<string, unknown>)["type"] === "folder",
    ) as Record<string, unknown> | undefined;
    if (!found) return null;
    return String(found["fileId"] ?? found["id"] ?? "");
  } catch {
    return null;
  }
}

/**
 * 폴더 목록 조회
 */
export async function listFolders(
  token: string,
  parentFolderId: string = "root",
  driveType: DriveType = "personal",
  sharedDriveId?: string,
): Promise<DriveFolder[]> {
  const baseUrl = getDriveBaseUrl(driveType, sharedDriveId);
  const res = await driveRequest(`${baseUrl}/files/${parentFolderId}/files`, token);
  const json = (await res.json()) as Record<string, unknown>;
  const items = json["data"] ?? json["items"] ?? [];
  if (!Array.isArray(items)) return [];
  return (items as Record<string, unknown>[])
    .filter((item) => item["type"] === "folder")
    .map((item) => ({
      folderId: String(item["fileId"] ?? item["id"] ?? ""),
      folderName: String(item["fileName"] ?? item["name"] ?? ""),
      parentFolderId: typeof item["parentFileId"] === "string" ? item["parentFileId"] : undefined,
    }));
}
