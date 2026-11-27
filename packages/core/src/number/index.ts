/**
 * 숫자 · 금액 · 용량 표시.
 *
 * 콤마를 `toLocaleString`에 맡기지 않는다 — 기기 · 서버 로케일과 ICU 판에 따라 결과가 달라질 수 있어
 * (같은 값이 화면과 알림에서 다르게 보이는 사고), 세 자리 콤마를 직접 넣는다.
 * ⚠️ 표시 전용이다. 포맷된 문자열을 다시 계산 · 저장에 쓰지 않는다(입력 칸은 `parseAmountInput`).
 */

/**
 * 세 자리마다 콤마. `NaN`·`Infinity`·`null`은 `'0'`.
 * `maxFractionDigits`까지 반올림하고 끝의 0은 지운다.
 * @example formatNumber(1234567) // "1,234,567"
 * @example formatNumber(-1234.5678, 2) // "-1,234.57"
 */
export function formatNumber(n: number | null | undefined, maxFractionDigits = 0): string {
  if (n == null || !Number.isFinite(n)) return "0";
  const factor = 10 ** maxFractionDigits;
  const rounded = Math.round(Math.abs(n) * factor) / factor;
  const [int, frac] = rounded.toFixed(maxFractionDigits).split(".") as [string, string | undefined];
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fracTrim = frac?.replace(/0+$/, "");
  const sign = n < 0 && rounded !== 0 ? "-" : "";
  return `${sign}${grouped}${fracTrim ? `.${fracTrim}` : ""}`;
}

/** `1,234원` */
export const won = (n: number | null | undefined) => `${formatNumber(n)}원`;

/** 만 원 이상은 `12.3만`, 그 아래는 `9,800원`. */
export function shortWon(n: number | null | undefined): string {
  const v = n == null || !Number.isFinite(n) ? 0 : n;
  if (Math.abs(v) >= 10_000) return `${formatNumber(v / 10_000, 1)}만`;
  return won(v);
}

/** 금액 입력 칸: 숫자만 남기고 세 자리 콤마. 앞자리 0은 지운다. `"0012a345"` → `"12,345"` */
export function formatAmountInput(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? formatNumber(Number(digits)) : "";
}

/** `formatAmountInput`이 만든 문자열을 숫자로. 비었으면 `0`. */
export const parseAmountInput = (value: string): number => Number(value.replace(/\D/g, "") || 0);

/**
 * 바이트 → 읽기 쉬운 용량. 1024 단위.
 * @example formatBytes(1536) // "1.5 KB"
 */
export function formatBytes(bytes: number | null | undefined, fractionDigits = 1): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return i === 0 ? `${Math.round(v)} B` : `${v.toFixed(fractionDigits)} ${units[i]}`;
}
