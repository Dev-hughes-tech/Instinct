"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Minus, Power, X } from "lucide-react";
import {
  usePluginWindows,
  type PluginWindow as PluginWindowState
} from "@/lib/audio/pluginWindowStore";
import type { ArchitexureParam, ArchitexurePlugin } from "@/lib/architexurePlugins";

/**
 * Floating plug-in window host. Renders every currently-open plug-in as its
 * own draggable card, layered by z-index. Every knob/slider drives the live
 * WebAudio effect node sitting on the master insert chain.
 */
export function PluginWindowHost() {
  const windows = usePluginWindows((s) => s.windows);
  if (windows.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40" data-testid="plugin-window-host">
      {windows.map((w) => (
        <PluginWindowCard key={w.windowId} window={w} />
      ))}
    </div>
  );
}

function PluginWindowCard({ window: w }: { window: PluginWindowState }) {
  const focus = usePluginWindows((s) => s.focus);
  const move = usePluginWindows((s) => s.move);
  const close = usePluginWindows((s) => s.close);
  const toggleBypass = usePluginWindows((s) => s.toggleBypass);
  const toggleMinimise = usePluginWindows((s) => s.toggleMinimise);
  const setParam = usePluginWindows((s) => s.setParam);
  const loadPreset = usePluginWindows((s) => s.loadPreset);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<{ offsetX: number; offsetY: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    focus(w.windowId);
    setDragging({ offsetX: e.clientX - w.x, offsetY: e.clientY - w.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      move(w.windowId, e.clientX - dragging.offsetX, e.clientY - dragging.offsetY);
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, move, w.windowId]);

  return (
    <div
      ref={dragRef}
      className={clsx(
        "pointer-events-auto absolute overflow-hidden rounded-2xl border border-black/20 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]",
        w.minimised ? "h-10" : ""
      )}
      style={{
        left: w.x,
        top: w.y,
        width: w.width,
        height: w.minimised ? 40 : w.height,
        zIndex: w.z
      }}
      onMouseDown={() => focus(w.windowId)}
      data-testid={`plugin-window-${w.plugin.id}`}
    >
      <header
        onMouseDown={onMouseDown}
        className="flex h-10 cursor-grab items-center justify-between border-b border-black/10 px-3 text-surface-900 active:cursor-grabbing"
        style={{
          background: `linear-gradient(180deg, ${w.plugin.accent}33, ${w.plugin.accent}11), #f6f7f9`
        }}
      >
        <div className="flex items-center gap-2 text-[12px]">
          <div
            className="h-5 w-5 rounded-md"
            style={{
              background: `radial-gradient(circle at 30% 25%, #fff 0%, ${w.plugin.accent} 80%)`,
              boxShadow: `0 0 8px ${w.plugin.accent}77`
            }}
          />
          <div className="flex flex-col leading-none">
            <span className="font-semibold">{w.plugin.name}</span>
            <span className="text-[9px] uppercase tracking-[0.12em] text-surface-500">
              {w.plugin.family} · {w.plugin.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={clsx(
              "flex h-7 items-center gap-1 rounded-md border border-black/10 px-2 text-[10px] uppercase tracking-[0.12em]",
              w.bypass ? "bg-surface-200 text-surface-500" : "bg-white text-surface-900"
            )}
            onClick={() => toggleBypass(w.windowId)}
          >
            <Power className="h-3 w-3" /> {w.bypass ? "Bypass" : "Active"}
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md border border-black/10 bg-white"
            onClick={() => toggleMinimise(w.windowId)}
            aria-label="Minimise"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md border border-black/10 bg-white"
            onClick={() => close(w.windowId)}
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </header>

      {!w.minimised && (
        <div className="grid h-[calc(100%-2.5rem)] grid-cols-[1fr_160px]">
          <section className="overflow-auto p-4">
            <div className="grid grid-cols-4 gap-3">
              {w.plugin.parameters.map((p) => (
                <ParamControl
                  key={p.id}
                  param={p}
                  value={w.values[p.id] ?? p.default}
                  accent={w.plugin.accent}
                  onChange={(v) => setParam(w.windowId, p.id, v)}
                />
              ))}
            </div>
            <footer className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-surface-500">
              <span>
                {w.plugin.channels} · {w.plugin.latencyMs.toFixed(2)} ms latency · {w.plugin.cpuTierMs.toFixed(2)} ms CPU
              </span>
              <span>v{w.plugin.version}</span>
            </footer>
          </section>
          <aside className="flex flex-col gap-1 overflow-auto border-l border-surface-200 bg-surface-50 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-surface-500">Presets</div>
            {w.plugin.presets.map((p) => (
              <button
                key={p.name}
                onClick={() => loadPreset(w.windowId, p.name)}
                className="flex flex-col rounded-md border border-surface-200 bg-white px-2 py-1.5 text-left text-[11px] hover:bg-white"
              >
                <span className="font-medium text-surface-900">{p.name}</span>
                <span className="text-[9px] text-surface-500">{p.designer}</span>
              </button>
            ))}
            {w.plugin.presets.length === 0 && (
              <div className="text-[11px] text-surface-500">Factory presets unavailable.</div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function ParamControl({
  param,
  value,
  accent,
  onChange
}: {
  param: ArchitexureParam;
  value: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  const pct = (value - param.min) / (param.max - param.min || 1);

  const drag = useKnobDrag(param, value, onChange);

  if (param.uiKind === "switch") {
    const on = value > (param.min + param.max) / 2;
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => onChange(on ? param.min : param.max)}
          className={clsx(
            "flex h-7 w-12 items-center rounded-full border border-black/10 p-0.5 transition",
            on ? "justify-end" : "justify-start"
          )}
          style={{ background: on ? accent : "#eceff3" }}
        >
          <span className="h-5 w-5 rounded-full bg-white shadow" />
        </button>
        <span className="text-[10px] uppercase tracking-[0.12em] text-surface-500">{param.label}</span>
      </div>
    );
  }

  if (param.uiKind === "slider") {
    return (
      <div className="flex flex-col items-center gap-1">
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={(param.max - param.min) / 100}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-black"
        />
        <span className="text-[10px] uppercase tracking-[0.12em] text-surface-500">{param.label}</span>
        <span className="text-[10px] text-surface-700">
          {value.toFixed(param.curve === "step" ? 0 : 2)} {param.unit}
        </span>
      </div>
    );
  }

  // Knob (default / large-knob / small-knob / graph / meter / pad / display)
  const size = param.uiKind === "large-knob" ? 56 : 44;
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const sweep = 270;
  const start = 135;
  const end = start + sweep * pct;
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(start));
  const y1 = cy + r * Math.sin(rad(start));
  const x2 = cx + r * Math.cos(rad(end));
  const y2 = cy + r * Math.sin(rad(end));
  const large = end - start > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-1" onMouseDown={drag}>
      <div className="relative flex items-center justify-center rounded-full" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(20,22,26,0.12)" strokeWidth={2.5} />
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none"
            stroke={accent}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </svg>
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-[0.12em] text-surface-500">{param.label}</span>
      <span className="text-[10px] text-surface-700">
        {value.toFixed(param.curve === "step" ? 0 : 2)} {param.unit}
      </span>
    </div>
  );
}

function useKnobDrag(
  param: ArchitexureParam,
  value: number,
  onChange: (v: number) => void
) {
  return useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startValue = value;
      const range = param.max - param.min;
      const onMove = (ev: MouseEvent) => {
        const dy = startY - ev.clientY;
        const next = Math.max(param.min, Math.min(param.max, startValue + (dy / 200) * range));
        onChange(next);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [param, value, onChange]
  );
}
