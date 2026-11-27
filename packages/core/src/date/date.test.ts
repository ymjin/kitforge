import { describe, expect, it } from "vitest";
import {
  addDays,
  daysUntil,
  formatKst,
  formatKstDate,
  formatKstDateTime,
  formatKstMonthDay,
  formatKstTime,
  formatRelative,
  kstDayRange,
  kstParts,
  kstStartOfDay,
  parseKstDateTime,
  shiftMonth,
  toDate,
  toKstDateString,
  todayKst,
} from "./index.js";

// 2026-11-03 15:04:05 KST (화)
const T = "2026-11-03T06:04:05Z";

describe("toDate", () => {
  it("reads offset-less datetimes as UTC", () => {
    expect(toDate("2026-11-02T15:30:00")!.toISOString()).toBe("2026-11-02T15:30:00.000Z");
    expect(toDate("2026-11-02 15:30")!.toISOString()).toBe("2026-11-02T15:30:00.000Z");
  });
  it("keeps explicit offsets", () => {
    expect(toDate("2026-11-03T00:00:00+09:00")!.toISOString()).toBe("2026-11-02T15:00:00.000Z");
  });
  it("returns null for empty or invalid input", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate("")).toBeNull();
    expect(toDate("not a date")).toBeNull();
  });
  it("does not mutate a Date argument", () => {
    const d = new Date(T);
    expect(toDate(d)).not.toBe(d);
  });
});

describe("formatKst", () => {
  it("formats in KST regardless of the host time zone", () => {
    expect(formatKst(T, "yyyy.MM.dd (E) a h:mm")).toBe("2026.11.03 (화) 오후 3:04");
    expect(formatKst(T, "yy-M-d H:m:s EEEE")).toBe("26-11-3 15:4:5 화요일");
    expect(formatKst(T, "hh:mm:ss")).toBe("03:04:05");
  });
  it("crosses the date line at 15:00 UTC", () => {
    expect(toKstDateString("2026-12-31T14:59:59Z")).toBe("2026-12-31");
    expect(toKstDateString("2026-12-31T15:00:00Z")).toBe("2027-01-01");
  });
  it("keeps quoted text literal", () => {
    expect(formatKst(T, "H'시' m'분'")).toBe("15시 4분");
    expect(formatKst(T, "'yyyy'")).toBe("yyyy");
  });
  it("renders midnight and noon in 12h form", () => {
    expect(formatKst("2026-11-02T15:00:00Z", "a h시")).toBe("오전 12시");
    expect(formatKst("2026-11-03T03:00:00Z", "a h시")).toBe("오후 12시");
  });
  it("returns '' for unreadable input", () => {
    expect(formatKst(null, "yyyy")).toBe("");
    expect(formatKstDate("garbage")).toBe("");
  });
  it("accepts epoch milliseconds", () => {
    expect(formatKstDateTime(Date.parse(T))).toBe("2026.11.03 15:04");
  });
});

describe("presets", () => {
  it("format date, datetime, time, month-day", () => {
    expect(formatKstDate(T)).toBe("2026.11.03");
    expect(formatKstDateTime(T)).toBe("2026.11.03 15:04");
    expect(formatKstTime(T)).toBe("15:04");
    expect(formatKstMonthDay(T)).toBe("11월 3일");
  });
  it("todayKst uses the injected clock", () => {
    expect(todayKst("2026-11-02T16:00:00Z")).toBe("2026-11-03");
  });
});

describe("kstParts", () => {
  it("returns KST fields with weekday", () => {
    expect(kstParts(T)).toEqual({ year: 2026, month: 11, day: 3, hour: 15, minute: 4, second: 5, weekday: 2 });
  });
});

describe("day boundaries", () => {
  it("kstStartOfDay returns 00:00 KST as an instant", () => {
    expect(kstStartOfDay(T).toISOString()).toBe("2026-11-02T15:00:00.000Z");
    expect(kstStartOfDay("2026-11-02T15:00:00Z").toISOString()).toBe("2026-11-02T15:00:00.000Z");
    expect(kstStartOfDay("2026-11-02T14:59:59Z").toISOString()).toBe("2026-11-01T15:00:00.000Z");
  });
  it("kstDayRange is [start, start + 1 day)", () => {
    const { start, end } = kstDayRange(T);
    expect(end.getTime() - start.getTime()).toBe(86_400_000);
  });
  it("kstStartOfDay throws on invalid input", () => {
    expect(() => kstStartOfDay("nope")).toThrow(RangeError);
  });
});

describe("calendar arithmetic", () => {
  it("addDays crosses month and year", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("shiftMonth crosses years both ways", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-05", -17)).toBe("2024-12");
  });
  it("daysUntil counts KST calendar days", () => {
    const now = "2026-11-03T14:00:00Z"; // 11-03 23:00 KST
    expect(daysUntil("2026-11-03T15:00:00Z", now)).toBe(1); // 11-04 00:00 KST
    expect(daysUntil("2026-11-03T01:00:00Z", now)).toBe(0);
    expect(daysUntil("2026-11-01T01:00:00Z", now)).toBe(-2);
  });
});

describe("formatRelative", () => {
  const now = Date.parse(T);
  const ago = (ms: number) => now - ms;
  it("covers each unit", () => {
    expect(formatRelative(ago(10_000), now)).toBe("방금 전");
    expect(formatRelative(ago(5 * 60_000), now)).toBe("5분 전");
    expect(formatRelative(ago(3 * 3_600_000), now)).toBe("3시간 전");
    expect(formatRelative(ago(2 * 86_400_000), now)).toBe("2일 전");
    expect(formatRelative(ago(65 * 86_400_000), now)).toBe("2개월 전");
    expect(formatRelative(ago(362 * 86_400_000), now)).toBe("1년 전");
    expect(formatRelative(ago(800 * 86_400_000), now)).toBe("2년 전");
  });
  it("handles the future", () => {
    expect(formatRelative(now + 10_000, now)).toBe("곧");
    expect(formatRelative(now + 2 * 3_600_000, now)).toBe("2시간 후");
  });
  it("returns '' for unreadable input", () => {
    expect(formatRelative(undefined, now)).toBe("");
  });
});

describe("parseKstDateTime", () => {
  it("reads form values as KST wall time", () => {
    expect(parseKstDateTime("2026-11-03T09:00")!.toISOString()).toBe("2026-11-03T00:00:00.000Z");
    expect(parseKstDateTime("2026-11-03 09:00:30")!.toISOString()).toBe("2026-11-03T00:00:30.000Z");
    expect(parseKstDateTime("2026-11-03")!.toISOString()).toBe("2026-11-02T15:00:00.000Z");
  });
  it("round-trips with formatKst", () => {
    expect(formatKst(parseKstDateTime("2026-01-01T00:00"), "yyyy-MM-dd'T'HH:mm")).toBe("2026-01-01T00:00");
  });
  it("respects explicit offsets and rejects junk", () => {
    expect(parseKstDateTime("2026-11-03T09:00:00Z")!.toISOString()).toBe("2026-11-03T09:00:00.000Z");
    expect(parseKstDateTime("")).toBeNull();
    expect(parseKstDateTime("nope")).toBeNull();
  });
});
