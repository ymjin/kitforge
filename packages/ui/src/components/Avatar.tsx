import { useState } from "react";
import { cx } from "../utils/cx.js";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/** Shape compatible with `@ymjin/auth`'s session `user`. */
export interface AvatarUser {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface AvatarProps {
  /** Image URL. Falls back to `user.avatarUrl`. */
  src?: string;
  /** Name for the alt text and initials. Falls back to `user.name`/`user.email`. */
  name?: string;
  /** Size preset. Default: `"md"`. */
  size?: AvatarSize;
  /**
   * Convenience: pass an `@ymjin/auth` session user directly.
   * ```tsx
   * const { session } = useSession();
   * <Avatar user={session?.user} />
   * ```
   */
  user?: AvatarUser;
  className?: string;
}

/**
 * A user avatar with graceful fallback to initials when no image is set or the
 * image fails to load. Integrates with `@ymjin/auth` via the `user` prop.
 */
export function Avatar({ src, name, size = "md", user, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = src ?? user?.avatarUrl;
  const resolvedName = name ?? user?.name ?? user?.email;
  const showImage = resolvedSrc != null && resolvedSrc !== "" && !errored;

  return (
    <span className={cx("kf-avatar", `kf-avatar--${size}`, className)}>
      {showImage ? (
        <img
          className="kf-avatar__img"
          src={resolvedSrc}
          alt={resolvedName ?? ""}
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="kf-avatar__fallback" aria-label={resolvedName ?? "user"}>
          {getInitials(resolvedName)}
        </span>
      )}
    </span>
  );
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
