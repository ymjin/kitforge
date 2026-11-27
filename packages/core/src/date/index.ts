/**
 * KST(Asia/Seoul) 날짜 · 시각 — 표시와 날짜 경계 계산.
 *
 * - KST는 서머타임이 없는 **UTC+9 고정**이다. 그래서 `Intl`/`toLocale*`을 쓰지 않고
 *   오프셋을 더해 계산한다 — 서버(UTC) · 브라우저 · Hermes에서 출력이 글자 하나까지 같다.
 *   (`toLocaleString('ko-KR')`은 ICU 판마다 공백 · 「오후」 위치가 달라 하이드레이션이 어긋난다.)
 * - 시간대 표기가 없는 일시 문자열(`2026-11-02T15:30:00`)은 **UTC로 읽는다** — DB가 UTC를
 *   오프셋 없이 내주는 경우(Prisma `DateTime` 등)에 9시간 어긋나지 않게. 다르게 읽어야 하면
 *   호출 전에 오프셋을 붙인다.
 * - 표시 함수는 `null`·`undefined`·잘못된 값에 `''`를 돌려준다(화면에 `Invalid Date`가 새지 않게).
 */

export const KST_TIME_ZONE = "Asia/Seoul";
/** KST(UTC+9) 오프셋(ms). */
export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type DateInput = Date | string | number;

/** 시간대 표기 없는 일시 — `2026-11-02T15:30`, `2026-11-02 15:30:00.000` */
const NO_OFFSET_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * 입력을 `Date`로 바꾼다. 읽을 수 없으면 `null`.
 * 오프셋 없는 일시 문자열은 UTC로 읽는다(위 설명). `YYYY-MM-DD`는 표준대로 UTC 자정.
 */
export function toDate(input: DateInput | null | undefined): Date | null {
  if (input == null || input === "") return null;
  let d: Date;
  if (input instanceof Date) d = new Date(input.getTime());
  else if (typeof input === "string" && NO_OFFSET_DATETIME.test(input)) d = new Date(`${input.replace(" ", "T")}Z`);
  else d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * 시간대 표기 없는 날짜 · 일시를 **KST 벽시계 시각**으로 읽는다 — `<input type="date">` ·
 * `<input type="datetime-local">` 값처럼 사용자가 한국 시각으로 입력한 값에 쓴다.
 * (`toDate`는 같은 문자열을 UTC로 읽는다 — DB가 내준 값용.) 오프셋이 붙어 있으면 그대로 읽는다.
 * 읽을 수 없으면 `null`.
 * @example parseKstDateTime("2026-11-03T09:00") // 2026-11-03T00:00:00.000Z
 */
export function parseKstDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return toDate(`${v}T00:00:00+09:00`);
  if (NO_OFFSET_DATETIME.test(v)) return toDate(`${v.replace(" ", "T")}+09:00`);
  return toDate(v);
}

export interface KstParts {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  /** 0–23 */
  hour: number;
  minute: number;
  second: number;
  /** 0=일 … 6=토 */
  weekday: number;
}

/** KST 기준 연·월·일·시·분·초·요일. 읽을 수 없으면 `null`. */
export function kstParts(input: DateInput | null | undefined): KstParts | null {
  const d = toDate(input);
  if (!d) return null;
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  return {
    year: k.getUTCFullYear(),
    month: k.getUTCMonth() + 1,
    day: k.getUTCDate(),
    hour: k.getUTCHours(),
    minute: k.getUTCMinutes(),
    second: k.getUTCSeconds(),
    weekday: k.getUTCDay(),
  };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** 토큰은 긴 것부터 — `yyyy`가 `yy`보다, `MM`이 `M`보다 먼저 잡혀야 한다. 작은따옴표 안은 글자 그대로. */
const TOKEN = /'([^']*)'|yyyy|yy|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s|EEEE|E|a/g;

/**
 * KST 기준으로 패턴대로 그린다. 읽을 수 없으면 `''`.
 *
 * | 토큰 | 뜻 | 예 |
 * |---|---|---|
 * | `yyyy` `yy` | 연 | 2026 · 26 |
 * | `MM` `M` | 월 | 03 · 3 |
 * | `dd` `d` | 일 | 07 · 7 |
 * | `HH` `H` | 시(24) | 09 · 9 |
 * | `hh` `h` | 시(12) | 03 · 3 |
 * | `mm` `m` · `ss` `s` | 분 · 초 | 05 · 5 |
 * | `E` · `EEEE` | 요일 | 월 · 월요일 |
 * | `a` | 오전/오후 | 오후 |
 * | `'글자'` | 그대로 | `'시'` → 시 |
 *
 * @example formatKst("2026-11-03T06:04:05Z", "yyyy.MM.dd (E) a h:mm") // "2026.11.03 (화) 오후 3:04"
 */
export function formatKst(input: DateInput | null | undefined, pattern: string): string {
  const p = kstParts(input);
  if (!p) return "";
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return pattern.replace(TOKEN, (tok, literal: string | undefined) => {
    if (literal !== undefined) return literal;
    switch (tok) {
      case "yyyy": return String(p.year);
      case "yy": return pad(p.year % 100);
      case "MM": return pad(p.month);
      case "M": return String(p.month);
      case "dd": return pad(p.day);
      case "d": return String(p.day);
      case "HH": return pad(p.hour);
      case "H": return String(p.hour);
      case "hh": return pad(h12);
      case "h": return String(h12);
      case "mm": return pad(p.minute);
      case "m": return String(p.minute);
      case "ss": return pad(p.second);
      case "s": return String(p.second);
      case "EEEE": return `${WEEKDAYS_KO[p.weekday]}요일`;
      case "E": return WEEKDAYS_KO[p.weekday]!;
      case "a": return p.hour < 12 ? "오전" : "오후";
      default: return tok;
    }
  });
}

/** `2026.11.03` */
export const formatKstDate = (input: DateInput | null | undefined) => formatKst(input, "yyyy.MM.dd");
/** `2026.11.03 15:04` */
export const formatKstDateTime = (input: DateInput | null | undefined) => formatKst(input, "yyyy.MM.dd HH:mm");
/** `15:04` */
export const formatKstTime = (input: DateInput | null | undefined) => formatKst(input, "HH:mm");
/** `11월 3일` */
export const formatKstMonthDay = (input: DateInput | null | undefined) => formatKst(input, "M월 d일");

/** KST 기준 `YYYY-MM-DD` — DB 일자 비교 · 날짜 입력 값. 읽을 수 없으면 `''`. */
export const toKstDateString = (input: DateInput | null | undefined) => formatKst(input, "yyyy-MM-dd");

/** KST 오늘 `YYYY-MM-DD`. 계산 함수는 `now`를 인자로 받아 테스트에서 시각을 주입한다. */
export const todayKst = (now: DateInput = Date.now()) => toKstDateString(now);

/** 그 시각이 속한 KST 날짜의 자정(00:00 KST)에 해당하는 실제 시각. */
export function kstStartOfDay(input: DateInput): Date {
  const d = toDate(input);
  if (!d) throw new RangeError(`kstStartOfDay: invalid date ${String(input)}`);
  const shifted = d.getTime() + KST_OFFSET_MS;
  return new Date(shifted - (((shifted % DAY_MS) + DAY_MS) % DAY_MS) - KST_OFFSET_MS);
}

/** 그 시각이 속한 KST 날짜의 `[start, end)` — DB 범위 조회용. */
export function kstDayRange(input: DateInput): { start: Date; end: Date } {
  const start = kstStartOfDay(input);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** `YYYY-MM-DD`(KST 날짜)에 일수를 더한다. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const t = Date.UTC(y, m - 1, d) + days * DAY_MS;
  const r = new Date(t);
  return `${r.getUTCFullYear()}-${pad(r.getUTCMonth() + 1)}-${pad(r.getUTCDate())}`;
}

/** `YYYY-MM`에 달수를 더한다. `shiftMonth("2026-01", -1)` → `"2025-12"` */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const i = y * 12 + (m - 1) + delta;
  return `${Math.floor(i / 12)}-${pad((((i % 12) + 12) % 12) + 1)}`;
}

/** KST 날짜 기준 D-day. 오늘이 마감이면 0, 지났으면 음수. */
export function daysUntil(date: DateInput, now: DateInput = Date.now()): number {
  const target = toKstDateString(date);
  const today = toKstDateString(now);
  if (!target || !today) return NaN;
  return Math.round((Date.parse(`${target}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
}

/**
 * `방금 전` · `5분 전` · `3시간 전` · `2일 전` · `4개월 전` · `1년 전` (미래면 `후`).
 * 읽을 수 없으면 `''`.
 */
export function formatRelative(input: DateInput | null | undefined, now: DateInput = Date.now()): string {
  const d = toDate(input);
  const n = toDate(now);
  if (!d || !n) return "";
  const diff = n.getTime() - d.getTime();
  const suffix = diff >= 0 ? "전" : "후";
  const sec = Math.floor(Math.abs(diff) / 1000);
  if (sec < 60) return diff >= 0 ? "방금 전" : "곧";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 ${suffix}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 ${suffix}`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 ${suffix}`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon}개월 ${suffix}`;
  return `${Math.max(1, Math.floor(day / 365))}년 ${suffix}`;
}
