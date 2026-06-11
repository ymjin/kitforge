import { describe, expect, it } from "vitest";
import { resolveContentType, toBytes } from "./body.js";
import { StorageError } from "./types.js";

describe("toBytes", () => {
  it("encodes a string", async () => {
    expect(new TextDecoder().decode(await toBytes("hi"))).toBe("hi");
  });

  it("passes a Uint8Array through", async () => {
    const u = new Uint8Array([1, 2, 3]);
    expect(await toBytes(u)).toBe(u);
  });

  it("converts an ArrayBuffer", async () => {
    const buf = new TextEncoder().encode("ab").buffer;
    expect(new TextDecoder().decode(await toBytes(buf))).toBe("ab");
  });

  it("rejects an unsupported body with StorageError", async () => {
    await expect(toBytes(123 as never)).rejects.toBeInstanceOf(StorageError);
  });
});

describe("resolveContentType", () => {
  it("infers from extension", () => {
    expect(resolveContentType("a/b.png")).toBe("image/png");
    expect(resolveContentType("x.json")).toBe("application/json");
  });

  it("falls back to octet-stream", () => {
    expect(resolveContentType("noext")).toBe("application/octet-stream");
    expect(resolveContentType("a.unknownext")).toBe("application/octet-stream");
  });

  it("prefers an explicit type", () => {
    expect(resolveContentType("a.png", "text/plain")).toBe("text/plain");
  });
});
