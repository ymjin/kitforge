import { describe, expect, it } from "vitest";
import { color, radius, spacing, fontWeight } from "./index.js";

describe("tokens", () => {
  it("color scales are hex, named colors resolve", () => {
    expect(color.primary[500]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(color.danger[600]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(color.white).toBe("#ffffff");
  });

  it("spacing scale uses rem", () => {
    expect(spacing[4]).toBe("1rem");
    expect(spacing[0]).toBe("0rem");
  });

  it("radius + weight tokens", () => {
    expect(radius.full).toBe("9999px");
    expect(radius.md).toBe("0.375rem");
    expect(fontWeight.medium).toBe("500");
  });
});
