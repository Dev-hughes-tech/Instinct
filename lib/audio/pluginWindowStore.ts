/**
 * Floating plug-in window state.
 *
 * When the user clicks a plug-in anywhere in INSTINCT (Architexure browser,
 * channel strip, mixer insert, instrument plug-in slot) the window store
 * opens a PluginWindow for that plug-in, positions it, and tracks focus/
 * z-order so windows can be dragged around on top of the main surface.
 */

"use client";

import { create } from "zustand";
import { ARCHITEXURE_PLUGINS, type ArchitexurePlugin, type ArchitexureCategory } from "@/lib/architexurePlugins";
import { getEngine } from "./engine";

export interface PluginWindow {
  windowId: string;
  plugin: ArchitexurePlugin;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimised: boolean;
  bypass: boolean;
  engineInstanceId: string | null;
  /** Live parameter values, keyed by param id. */
  values: Record<string, number>;
}

interface PluginWindowState {
  windows: PluginWindow[];
  nextZ: number;
  open: (pluginId: string) => void;
  close: (windowId: string) => void;
  focus: (windowId: string) => void;
  move: (windowId: string, x: number, y: number) => void;
  toggleBypass: (windowId: string) => void;
  toggleMinimise: (windowId: string) => void;
  setParam: (windowId: string, paramId: string, value: number) => void;
  loadPreset: (windowId: string, presetName: string) => void;
}

const paramRange = (
  plugin: ArchitexurePlugin,
  paramId: string
): { min: number; max: number } => {
  const p = plugin.parameters.find((x) => x.id === paramId);
  return { min: p?.min ?? 0, max: p?.max ?? 1 };
};

const normaliseValue = (plugin: ArchitexurePlugin, paramId: string, raw: number): number => {
  const { min, max } = paramRange(plugin, paramId);
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (raw - min) / (max - min)));
};

const effectFromPlugin = (plugin: ArchitexurePlugin, values: Record<string, number>) => ({
  category: plugin.category as ArchitexureCategory,
  params: Object.fromEntries(
    plugin.parameters.map((p) => [
      canonicalKey(plugin.category, p.id),
      normaliseValue(plugin, p.id, values[p.id] ?? p.default)
    ])
  )
});

/**
 * The engine's PluginEffect schema expects a small set of canonical keys
 * (low/mid/high, threshold/ratio/attack/release/makeup, size/mix, time/feedback,
 * rate/depth, drive, loudness, gain). We map each plug-in's first-matching
 * parameter id to those keys so the effect responds live to every knob.
 */
function canonicalKey(category: ArchitexureCategory, paramId: string): string {
  const id = paramId.toLowerCase();
  if (category === "eq") {
    if (/(low|bass|sub)/.test(id)) return "low";
    if (/(mid|mids|presence)/.test(id)) return "mid";
    if (/(hi|high|top|air|treble)/.test(id)) return "high";
  }
  if (category === "dynamics" || category === "mastering") {
    if (/thr/.test(id)) return "threshold";
    if (/ratio/.test(id)) return "ratio";
    if (/att/.test(id)) return "attack";
    if (/rel/.test(id)) return "release";
    if (/(makeup|gain|level|out)/.test(id)) return "makeup";
    if (/loud/.test(id)) return "loudness";
  }
  if (category === "reverb") {
    if (/(size|room|hall|space|pre)/.test(id)) return "size";
    if (/(mix|wet|dry|blend)/.test(id)) return "mix";
    if (/dec/.test(id)) return "decay";
  }
  if (category === "delay") {
    if (/(time|delay|ms)/.test(id)) return "time";
    if (/(fb|feed|regen)/.test(id)) return "feedback";
    if (/(mix|wet|dry|blend)/.test(id)) return "mix";
  }
  if (category === "modulation") {
    if (/(rate|speed|freq)/.test(id)) return "rate";
    if (/(depth|amount|intensity)/.test(id)) return "depth";
  }
  if (category === "saturation" || category === "harmonics") {
    if (/(drive|input|saturation|amount)/.test(id)) return "drive";
  }
  return paramId;
}

export const usePluginWindows = create<PluginWindowState>((set, get) => ({
  windows: [],
  nextZ: 1,

  open: (pluginId) => {
    const existing = get().windows.find((w) => w.plugin.id === pluginId);
    if (existing) {
      get().focus(existing.windowId);
      return;
    }
    const plugin = ARCHITEXURE_PLUGINS.find((p) => p.id === pluginId);
    if (!plugin) return;
    const values: Record<string, number> = {};
    for (const p of plugin.parameters) values[p.id] = p.default;
    const defaultPreset = plugin.presets[0];
    if (defaultPreset) Object.assign(values, defaultPreset.values);
    const z = get().nextZ;
    const offset = (get().windows.length % 6) * 24;
    const windowId = `pw-${plugin.id}-${Date.now().toString(36)}`;
    const win: PluginWindow = {
      windowId,
      plugin,
      x: 140 + offset,
      y: 96 + offset,
      width: 560,
      height: 360,
      z,
      minimised: false,
      bypass: false,
      engineInstanceId: null,
      values
    };
    set((s) => ({ windows: [...s.windows, win], nextZ: z + 1 }));

    // Instantiate on the engine's insert chain.
    void (async () => {
      try {
        const engine = await getEngine();
        const effect = effectFromPlugin(plugin, values);
        const instanceId = await engine.openPlugin(plugin.id, effect);
        set((s) => ({
          windows: s.windows.map((w) =>
            w.windowId === windowId ? { ...w, engineInstanceId: instanceId } : w
          )
        }));
      } catch {
        /* engine not available — window still usable offline */
      }
    })();
  },

  close: (windowId) => {
    const w = get().windows.find((x) => x.windowId === windowId);
    if (!w) return;
    if (w.engineInstanceId) {
      void (async () => {
        try {
          const engine = await getEngine();
          await engine.closePlugin(w.engineInstanceId!);
        } catch {
          /* noop */
        }
      })();
    }
    set((s) => ({ windows: s.windows.filter((x) => x.windowId !== windowId) }));
  },

  focus: (windowId) => {
    const z = get().nextZ;
    set((s) => ({
      windows: s.windows.map((w) => (w.windowId === windowId ? { ...w, z } : w)),
      nextZ: z + 1
    }));
  },

  move: (windowId, x, y) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.windowId === windowId ? { ...w, x, y } : w))
    }));
  },

  toggleBypass: (windowId) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.windowId === windowId ? { ...w, bypass: !w.bypass } : w
      )
    }));
  },
  toggleMinimise: (windowId) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.windowId === windowId ? { ...w, minimised: !w.minimised } : w
      )
    }));
  },

  setParam: (windowId, paramId, value) => {
    const win = get().windows.find((w) => w.windowId === windowId);
    if (!win) return;
    const next = { ...win.values, [paramId]: value };
    set((s) => ({
      windows: s.windows.map((w) =>
        w.windowId === windowId ? { ...w, values: next } : w
      )
    }));
    if (win.engineInstanceId) {
      void (async () => {
        try {
          const engine = await getEngine();
          const key = canonicalKey(win.plugin.category, paramId);
          const normalised = normaliseValue(win.plugin, paramId, value);
          engine.setPluginParam(win.engineInstanceId!, key, normalised);
        } catch {
          /* noop */
        }
      })();
    }
  },

  loadPreset: (windowId, presetName) => {
    const win = get().windows.find((w) => w.windowId === windowId);
    if (!win) return;
    const preset = win.plugin.presets.find((p) => p.name === presetName);
    if (!preset) return;
    const base: Record<string, number> = {};
    for (const p of win.plugin.parameters) base[p.id] = p.default;
    const values = { ...base, ...preset.values };
    set((s) => ({
      windows: s.windows.map((w) =>
        w.windowId === windowId ? { ...w, values } : w
      )
    }));
    if (win.engineInstanceId) {
      void (async () => {
        try {
          const engine = await getEngine();
          const effect = effectFromPlugin(win.plugin, values);
          for (const [k, v] of Object.entries(effect.params)) {
            engine.setPluginParam(win.engineInstanceId!, k, v);
          }
        } catch {
          /* noop */
        }
      })();
    }
  }
}));
