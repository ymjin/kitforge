"use client";
import { DropZone, FileTrigger, Text } from "react-aria-components";
import { useState, type ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { Button } from "./Button.js";

export interface FileUploadProps {
  label?: ReactNode;
  /** Hint text inside the drop zone. */
  description?: ReactNode;
  /** Accepted MIME types, e.g. `["image/png", "image/jpeg"]`. */
  acceptedFileTypes?: string[];
  /** Allow selecting more than one file. */
  allowsMultiple?: boolean;
  /** Called with the selected/dropped files. */
  onSelect?: (files: File[]) => void;
  /**
   * Direct-upload hook. Return a signed `PUT` URL for a file and the component
   * uploads it straight to storage — pair with `@kitforge/storage`'s
   * `getSignedUrl(key, { method: "PUT" })` on your server.
   */
  getUploadUrl?: (file: File) => Promise<string>;
  /** Called after a file is successfully uploaded via `getUploadUrl`. */
  onUploaded?: (file: File, url: string) => void;
  /** Called if a direct upload fails. */
  onError?: (file: File, error: unknown) => void;
  className?: string;
}

/**
 * A drag-and-drop file upload (React Aria `DropZone` + `FileTrigger`).
 *
 * With `getUploadUrl`, it uploads each file directly to object storage using a
 * signed `PUT` URL — no bytes pass through your app server:
 *
 * ```tsx
 * <FileUpload
 *   label="프로필 사진"
 *   acceptedFileTypes={["image/png", "image/jpeg"]}
 *   getUploadUrl={(file) =>
 *     fetch(`/api/upload-url?key=${file.name}`).then((r) => r.text())
 *   }
 *   onUploaded={(file, url) => console.log("uploaded", url)}
 * />
 * ```
 */
export function FileUpload({
  label,
  description = "파일을 끌어다 놓거나 선택하세요",
  acceptedFileTypes,
  allowsMultiple = false,
  onSelect,
  getUploadUrl,
  onUploaded,
  onError,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    onSelect?.(files);
    if (!getUploadUrl) return;

    setUploading(true);
    try {
      for (const file of files) {
        try {
          const url = await getUploadUrl(file);
          const res = await fetch(url, {
            method: "PUT",
            headers: { "content-type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
          onUploaded?.(file, url);
        } catch (err) {
          onError?.(file, err);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cx("kf-field", className)}>
      {label != null && <span className="kf-field__label">{label}</span>}
      <DropZone
        className="kf-fileupload"
        getDropOperation={() => "copy"}
        onDrop={async (e) => {
          const files = await Promise.all(
            e.items
              .filter((item): item is typeof item & { kind: "file" } => item.kind === "file")
              .map((item) => item.getFile()),
          );
          await handleFiles(files);
        }}
      >
        <div className="kf-fileupload__inner">
          <Text slot="label" className="kf-fileupload__hint">
            {uploading ? "업로드 중…" : description}
          </Text>
          <FileTrigger
            allowsMultiple={allowsMultiple}
            acceptedFileTypes={acceptedFileTypes}
            onSelect={(fileList) => {
              if (fileList) void handleFiles(Array.from(fileList));
            }}
          >
            <Button variant="outline" size="sm" isDisabled={uploading}>
              파일 선택
            </Button>
          </FileTrigger>
        </div>
      </DropZone>
    </div>
  );
}
