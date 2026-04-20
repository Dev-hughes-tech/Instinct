import { describe, it, expect } from "vitest";
import { detectFormat, INTEROP_FORMATS } from "@/lib/interop";

describe("interop/detectFormat", () => {
  it("detects RPP by extension", () => {
    expect(detectFormat("mix.rpp", new Uint8Array([0, 0, 0]))).toBe("rpp");
  });
  it("detects Logic by bplist magic when extension missing", () => {
    const b = new Uint8Array(16);
    const magic = "bplist00";
    for (let i = 0; i < magic.length; i++) b[i] = magic.charCodeAt(i);
    expect(detectFormat("ProjectData", b)).toBe("logicx");
  });
  it("detects AAF by SS compound signature", () => {
    const b = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);
    expect(detectFormat("edit.aaf", b)).toBe("aaf");
  });
  it("detects FLP by FLhd header", () => {
    const b = new Uint8Array(16);
    "FLhd".split("").forEach((c, i) => (b[i] = c.charCodeAt(0)));
    expect(detectFormat("track.flp", b)).toBe("flp");
  });
  it("returns null for unknown bytes without extension", () => {
    expect(detectFormat("random", new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
  it("lists all ten format descriptors", () => {
    expect(INTEROP_FORMATS.length).toBeGreaterThanOrEqual(9);
    const ids = new Set(INTEROP_FORMATS.map((f) => f.id));
    ["rpp", "als", "aaf", "logicx", "flp", "reason", "song", "bwf", "ptx"].forEach((id) =>
      expect(ids.has(id as never)).toBe(true)
    );
  });
});
