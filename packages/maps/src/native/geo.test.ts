import { describe, expect, it } from "vitest";
import { deltaToZoom, zoomToDelta } from "./geo.js";

describe("geo", () => {
  it("zoomToDelta", () => {
    expect(zoomToDelta(0)).toBe(360);
    expect(zoomToDelta(1)).toBe(180);
  });

  it("zoom ↔ delta roundtrip", () => {
    expect(deltaToZoom(zoomToDelta(12))).toBeCloseTo(12);
  });

  it("deltaToZoom guards non-positive input", () => {
    expect(deltaToZoom(0)).toBe(0);
    expect(deltaToZoom(-5)).toBe(0);
  });
});
