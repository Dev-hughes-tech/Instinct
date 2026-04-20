import { describe, it, expect } from "vitest";
import { INSTRUMENTS, findInstrument, instrumentsByCategory, searchInstruments } from "@/lib/instruments";

describe("instruments catalog", () => {
  it("ships at least 30 instruments", () => {
    expect(INSTRUMENTS.length).toBeGreaterThanOrEqual(30);
  });
  it("every instrument declares an internal INSTINCT://core library uri", () => {
    for (const inst of INSTRUMENTS) {
      expect(inst.library.rootUri.startsWith("INSTINCT://core")).toBe(true);
    }
  });
  it("findInstrument returns match by id", () => {
    const first = INSTRUMENTS[0]!;
    expect(findInstrument(first.id)?.id).toBe(first.id);
  });
  it("instrumentsByCategory buckets every instrument exactly once", () => {
    const totals = Object.values(instrumentsByCategory()).reduce((a, b) => a + b.length, 0);
    expect(totals).toBe(INSTRUMENTS.length);
  });
  it("searchInstruments finds by name substring", () => {
    const mpc = searchInstruments("mpc");
    expect(mpc.length).toBeGreaterThan(0);
  });
});
