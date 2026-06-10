import { cx } from "../utils/cx.js";

export interface PaginationProps {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called with the new page when the user navigates. */
  onPageChange: (page: number) => void;
  /** How many page numbers to show around the current one. Default: 1. */
  siblingCount?: number;
  className?: string;
}

const ELLIPSIS = "…";

/**
 * Page navigation with previous/next and numbered buttons, collapsing long
 * ranges with ellipses. Not headless — plain accessible buttons.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const items = buildRange(page, totalPages, siblingCount);

  const go = (p: number) => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <nav className={cx("kf-pagination", className)} aria-label="페이지 탐색">
      <button
        type="button"
        className="kf-pagination__btn kf-pagination__nav"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {items.map((item, i) =>
        item === ELLIPSIS ? (
          <span key={`e${i}`} className="kf-pagination__ellipsis" aria-hidden="true">
            {ELLIPSIS}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={cx("kf-pagination__btn", item === page && "kf-pagination__btn--active")}
            onClick={() => go(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`${item} 페이지`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="kf-pagination__btn kf-pagination__nav"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}

/** Build the list of page numbers + ellipses to render. */
function buildRange(
  page: number,
  total: number,
  siblings: number,
): (number | typeof ELLIPSIS)[] {
  // Show: first, last, current ± siblings, with ellipses for gaps.
  // If everything fits (<= 7 slots typical), show all.
  const totalSlots = siblings * 2 + 5; // first + last + current + 2 siblings + 2 ellipses
  if (total <= totalSlots) {
    return range(1, total);
  }

  const leftSibling = Math.max(page - siblings, 1);
  const rightSibling = Math.min(page + siblings, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  const out: (number | typeof ELLIPSIS)[] = [1];
  if (showLeftEllipsis) out.push(ELLIPSIS);
  else out.push(...range(2, leftSibling - 1));

  out.push(...range(leftSibling, rightSibling).filter((p) => p !== 1 && p !== total));

  if (showRightEllipsis) out.push(ELLIPSIS);
  else out.push(...range(rightSibling + 1, total - 1));

  out.push(total);
  return out;
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}
