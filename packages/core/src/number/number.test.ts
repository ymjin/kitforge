import { describe, expect, it } from "vitest";
import { formatAmountInput, formatBytes, formatNumber, parseAmountInput, shortWon, won } from "./index.js";

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(-20000)).toBe("-20,000");
  });
  it("rounds to maxFractionDigits and trims zeros", () => {
    expect(formatNumber(1234.5678, 2)).toBe("1,234.57");
    expect(formatNumber(1234.5, 2)).toBe("1,234.5");
    expect(formatNumber(1234.004, 2)).toBe("1,234");
    expect(formatNumber(1499.6, 0)).toBe("1,500");
  });
  it("defaults to 3 fraction digits like toLocaleString", () => {
    expect(formatNumber(1499.6)).toBe("1,499.6");
    expect(formatNumber(12.34567)).toBe("12.346");
    expect(formatNumber(-0.4)).toBe("-0.4");
  });
  it("does not print -0", () => {
    expect(formatNumber(-0.4, 0)).toBe("0");
    expect(formatNumber(-0.0001)).toBe("0");
  });
  it("maps non-finite and nullish to '0'", () => {
    expect(formatNumber(NaN)).toBe("0");
    expect(formatNumber(Infinity)).toBe("0");
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
  });
});

describe("won / shortWon", () => {
  it("appends 원", () => {
    expect(won(12345)).toBe("12,345원");
  });
  it("shortens from 10,000", () => {
    expect(shortWon(9800)).toBe("9,800원");
    expect(shortWon(10_000)).toBe("1만");
    expect(shortWon(123_456)).toBe("12.3만");
    expect(shortWon(12_345_678)).toBe("1,234.6만");
    expect(shortWon(-50_000)).toBe("-5만");
    expect(shortWon(NaN)).toBe("0원");
  });
});

describe("amount input", () => {
  it("keeps digits, strips leading zeros, groups", () => {
    expect(formatAmountInput("0012a345")).toBe("12,345");
    expect(formatAmountInput("0")).toBe("0");
    expect(formatAmountInput("")).toBe("");
    expect(formatAmountInput("abc")).toBe("");
  });
  it("parses back to a number", () => {
    expect(parseAmountInput("12,345")).toBe(12345);
    expect(parseAmountInput("")).toBe(0);
  });
});

describe("formatBytes", () => {
  it("scales by 1024", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(3.25 * 1024 ** 3, 2)).toBe("3.25 GB");
  });
  it("treats invalid as 0 B", () => {
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(null)).toBe("0 B");
  });
});
