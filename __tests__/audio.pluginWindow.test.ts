/**
 * Plug-in window store tests — ensures clicking a plug-in opens a window,
 * focuses it, and cleanly tears down.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePluginWindows } from "@/lib/audio/pluginWindowStore";
import { ARCHITEXURE_PLUGINS } from "@/lib/architexurePlugins";
import { __resetEngineForTest } from "@/lib/audio/engine";

describe("plug-in window store", () => {
  beforeEach(() => {
    __resetEngineForTest({
      backend: "webaudio",
      init: vi.fn(async () => {}),
      dispose: vi.fn(async () => {}),
      listDevices: vi.fn(async () => []),
      getDevice: vi.fn(async () => null),
      setDevice: vi.fn(async () => {}),
      getSampleRate: () => 48000,
      setSampleRate: vi.fn(async () => {}),
      getBitDepth: () => 24,
      setBitDepth: vi.fn(),
      getBufferSize: () => 128,
      setBufferSize: vi.fn(async () => {}),
      play: vi.fn(async () => {}),
      stop: vi.fn(async () => {}),
      setTempo: vi.fn(),
      setMetronome: vi.fn(),
      getTransport: () => ({ playing: false, metronome: false, tempoBpm: 92, positionSec: 0 }),
      getMasterLevel: () => ({ peak: 0, rms: 0 }),
      subscribeMasterLevel: () => () => {},
      audition: vi.fn(),
      allNotesOff: vi.fn(),
      openPlugin: vi.fn(async () => "fake-instance"),
      closePlugin: vi.fn(async () => {}),
      setPluginParam: vi.fn()
    });
    usePluginWindows.setState({ windows: [], nextZ: 1 });
  });

  it("opens a window for a real Architexure plug-in", () => {
    const firstPluginId = ARCHITEXURE_PLUGINS[0]!.id;
    usePluginWindows.getState().open(firstPluginId);
    const windows = usePluginWindows.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0]!.plugin.id).toBe(firstPluginId);
  });

  it("does not double-open an already-open plug-in", () => {
    const firstPluginId = ARCHITEXURE_PLUGINS[0]!.id;
    usePluginWindows.getState().open(firstPluginId);
    usePluginWindows.getState().open(firstPluginId);
    expect(usePluginWindows.getState().windows).toHaveLength(1);
  });

  it("closes a window by id", () => {
    const firstPluginId = ARCHITEXURE_PLUGINS[0]!.id;
    usePluginWindows.getState().open(firstPluginId);
    const id = usePluginWindows.getState().windows[0]!.windowId;
    usePluginWindows.getState().close(id);
    expect(usePluginWindows.getState().windows).toHaveLength(0);
  });

  it("moves a window to new coordinates", () => {
    const firstPluginId = ARCHITEXURE_PLUGINS[0]!.id;
    usePluginWindows.getState().open(firstPluginId);
    const win = usePluginWindows.getState().windows[0]!;
    usePluginWindows.getState().move(win.windowId, 555, 222);
    const moved = usePluginWindows.getState().windows.find((w) => w.windowId === win.windowId);
    expect(moved?.x).toBe(555);
    expect(moved?.y).toBe(222);
  });

  it("updates parameter values in place", () => {
    const plugin = ARCHITEXURE_PLUGINS[0]!;
    usePluginWindows.getState().open(plugin.id);
    const win = usePluginWindows.getState().windows[0]!;
    const firstParam = plugin.parameters[0]!;
    const next = (firstParam.min + firstParam.max) / 2;
    usePluginWindows.getState().setParam(win.windowId, firstParam.id, next);
    const updated = usePluginWindows.getState().windows.find((w) => w.windowId === win.windowId);
    expect(updated?.values[firstParam.id]).toBeCloseTo(next, 5);
  });
});
