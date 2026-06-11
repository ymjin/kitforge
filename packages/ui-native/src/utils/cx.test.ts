import { describe, expect, it } from "vitest";
import { cx } from "./cx.js";

describe("cx", () => {
  it("joins truthy parts with spaces", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy parts", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns an empty string with no truthy parts", () => {
    expect(cx(false, null, undefined)).toBe("");
  });
});
