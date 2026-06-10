import type { HTMLAttributes } from "react";
import { cx } from "../utils/cx.js";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

/** A surface container with token-based padding, radius, border, and shadow. */
export function Card({ className, ...props }: CardProps) {
  return <div className={cx("kf-card", className)} {...props} />;
}

/** Optional header region for a {@link Card}. */
export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cx("kf-card__header", className)} {...props} />;
}

/** Main content region for a {@link Card}. */
export function CardBody({ className, ...props }: CardProps) {
  return <div className={cx("kf-card__body", className)} {...props} />;
}

/** Optional footer region for a {@link Card}. */
export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cx("kf-card__footer", className)} {...props} />;
}
