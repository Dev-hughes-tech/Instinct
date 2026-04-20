import { describe, it, expect } from "vitest";
import { ARCHITEXURE_PLUGINS, byCategory, findPlugin } from "@/lib/architexurePlugins";

describe("architexure plugin catalog", () => {
  it("ships at least 30 plug-ins", () => {
    expect(ARCHITEXURE_PLUGINS.length).toBeGreaterThanOrEqual(30);
  });
  it("every plugin has parameters + at least one preset", () => {
    for (const p of ARCHITEXURE_PLUGINS) {
      expect(p.parameters.length).toBeGreaterThan(0);
      expect(p.presets.length).toBeGreaterThan(0);
    }
  });
  it("findPlugin retrieves by id", () => {
    const first = ARCHITEXURE_PLUGINS[0]!;
    expect(findPlugin(first.id)?.id).toBe(first.id);
  });
  it("byCategory covers every plugin", () => {
    const total = Object.values(byCategory()).reduce((a, b) => a + b.length, 0);
    expect(total).toBe(ARCHITEXURE_PLUGINS.length);
  });
});
