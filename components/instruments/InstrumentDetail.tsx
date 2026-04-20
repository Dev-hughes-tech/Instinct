"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { ChevronRight, Database, Sparkles } from "lucide-react";
import type { VirtualInstrument } from "@/lib/instruments";
import { DrumMachine } from "./DrumMachine";
import { KeyboardStrip } from "./KeyboardStrip";
import { useInstruments } from "@/lib/instrumentsStore";

/**
 * Renders the appropriate UI surface for the currently selected instrument.
 * Drum-machine-kind instruments get the full MPC UI; everything else gets
 * a macro-knob panel + keyboard / articulation surface.
 */
export function InstrumentDetail({ instrument }: { instrument: VirtualInstrument }) {
  const selectPreset = useInstruments((s) => s.selectPreset);
  const presetIndex = useInstruments((s) => s.selectedPresetIndex);

  if (instrument.uiKind === "mpc") {
    return <DrumMachine instrument={instrument} />;
  }

  return <MacroPanel instrument={instrument} presetIndex={presetIndex} selectPreset={selectPreset} />;
}

function MacroPanel({
  instrument,
  presetIndex,
  selectPreset
}: {
  instrument: VirtualInstrument;
  presetIndex: number;
  selectPreset: (i: number) => void;
}) {
  const preset = instrument.presets[presetIndex] ?? instrument.presets[0];
  const values = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of instrument.macros) out[m.id] = m.default;
    if (preset?.values) Object.assign(out, preset.values);
    return out;
  }, [instrument, preset]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-surface-200 bg-white">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-surface-200 px-4 py-3">
        <div
          className="h-9 w-9 rounded-md"
          style={{
            background: `radial-gradient(circle at 30% 25%, #fff 0%, ${instrument.accent} 75%)`,
            boxShadow: `0 0 16px ${instrument.accent}66`
          }}
        />
        <div className="leading-tight">
          <div className="label-tiny">{instrument.family}</div>
          <div className="text-[15px] font-semibold text-surface-900">{instrument.name}</div>
        </div>
        <span className="ml-auto text-[11px] text-surface-500">
          {instrument.polyphony} voices · {instrument.library.format} · {instrument.library.velocityLayers} vel layers
        </span>
      </header>

      <div className="grid flex-1 grid-cols-[1fr_260px] overflow-hidden">
        <section className="flex flex-col overflow-hidden p-4">
          {/* macros */}
          <div className="panel-surface flex gap-4 rounded-xl p-4">
            {instrument.macros.map((m) => {
              const v = values[m.id] ?? m.default;
              return (
                <div key={m.id} className="flex flex-col items-center gap-1">
                  <ArcKnob value={v} accent={instrument.accent} />
                  <span className="label-tiny">{m.label}</span>
                  <span className="num-readout text-[11px] text-surface-700">
                    {(v * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* keyboard or articulations */}
          {instrument.range ? (
            <div className="mt-4">
              <KeyboardStrip instrument={instrument} />
            </div>
          ) : null}

          {instrument.articulations && instrument.articulations.length > 0 && (
            <div className="mt-4 panel-surface rounded-xl p-3">
              <div className="label-tiny mb-2">Articulations</div>
              <div className="flex flex-wrap gap-2">
                {instrument.articulations.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-md border border-surface-200 bg-white px-2 py-1 text-[11px] text-surface-700"
                  >
                    <span className="text-surface-500">
                      {a.keySwitch != null ? `KS ${a.keySwitch} · ` : ""}
                    </span>
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto flex items-center gap-2 pt-4">
            <button className="flex items-center gap-1 rounded-md border border-surface-200 bg-white px-3 py-1.5 text-[11px] text-surface-700 hover:bg-surface-50">
              <Sparkles className="h-3 w-3 text-accent-violet" /> Ask Michael for Preset
            </button>
            <span className="ml-auto text-[11px] text-surface-500">
              Internal library · zero rewire · {instrument.library.rootUri}
            </span>
          </div>
        </section>

        <aside className="flex flex-col gap-2 overflow-auto border-l border-surface-200 bg-surface-50 p-3">
          <div className="label-tiny flex items-center gap-1">
            <Database className="h-3 w-3" /> Preset Bank
          </div>
          <ul className="flex flex-col gap-1">
            {instrument.presets.map((p, i) => (
              <li key={p.name}>
                <button
                  onClick={() => selectPreset(i)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px]",
                    i === presetIndex ? "bg-white shadow-lift" : "hover:bg-white"
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-surface-900">{p.name}</div>
                    <div className="truncate text-[10px] text-surface-500">
                      {p.designer} · {p.tags.join(", ") || "—"}
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 flex-none text-surface-400" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function ArcKnob({ value, accent }: { value: number; accent: string }) {
  const size = 52;
  const r = 20;
  const cx = size / 2;
  const cy = size / 2;
  const sweep = 270;
  const start = 135;
  const end = start + sweep * value;
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(start));
  const y1 = cy + r * Math.sin(rad(start));
  const x2 = cx + r * Math.cos(rad(end));
  const y2 = cy + r * Math.sin(rad(end));
  const large = end - start > 180 ? 1 : 0;

  return (
    <div className="knob-base flex h-[52px] w-[52px] items-center justify-center rounded-full">
      <svg width={size} height={size} className="absolute">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(20,22,26,0.1)" strokeWidth={2.5} />
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
          fill="none"
          stroke={accent}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="relative z-10 h-2 w-2 rounded-full"
        style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
      />
    </div>
  );
}
