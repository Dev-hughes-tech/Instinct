import { describe, it, expect } from "vitest";
import { MENU_BAR, type MenuItem } from "@/lib/menus";

function flatten(items: MenuItem[]): MenuItem[] {
  return items.flatMap((i) => (i.submenu ? [i, ...flatten(i.submenu)] : [i]));
}

describe("menus", () => {
  it("exports a 10-root menu bar", () => {
    expect(MENU_BAR.length).toBe(10);
    const ids = MENU_BAR.map((r) => r.id);
    ["file", "edit", "view", "track", "clip", "midi", "plugins", "ai", "window", "help"].forEach(
      (id) => expect(ids).toContain(id)
    );
  });

  it("every non-separator item has a stable id", () => {
    for (const root of MENU_BAR) {
      for (const item of flatten(root.items)) {
        if (item.separator) continue;
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
      }
    }
  });

  it("ids are unique across the menu tree (excluding separators)", () => {
    const seen = new Set<string>();
    for (const root of MENU_BAR) {
      for (const item of flatten(root.items)) {
        if (item.separator) continue;
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    }
  });

  it("import submenu lists all six DAW formats", () => {
    const file = MENU_BAR.find((r) => r.id === "file")!;
    const imp = file.items.find((i) => i.id === "file.import");
    expect(imp?.submenu?.some((s) => s.id === "file.import.als")).toBe(true);
    expect(imp?.submenu?.some((s) => s.id === "file.import.rpp")).toBe(true);
    expect(imp?.submenu?.some((s) => s.id === "file.import.flp")).toBe(true);
    expect(imp?.submenu?.some((s) => s.id === "file.import.reason")).toBe(true);
    expect(imp?.submenu?.some((s) => s.id === "file.import.studioOne")).toBe(true);
    expect(imp?.submenu?.some((s) => s.id === "file.import.logic")).toBe(true);
  });
});
