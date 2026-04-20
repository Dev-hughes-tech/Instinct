"use client";

import clsx from "clsx";
import type { VirtualInstrument } from "@/lib/instruments";

/**
 * Arcade-style instrument card. Large thumbnail, category label, and
 * family tag — clicking the card loads the instrument instantly because
 * every instrument's samples live under INSTINCT://core (no rewiring).
 */
export function InstrumentCard({
  instrument,
  active,
  onSelect
}: {
  instrument: VirtualInstrument;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      data-active={active ? true : false}
      data-testid={`instrument-card-${instrument.id}`}
      className="arcade-card group flex w-full flex-col overflow-hidden rounded-xl text-left"
    >
      {/* Thumbnail — procedural gradient so no image files are required. */}
      <div
        className="relative h-28 w-full"
        style={{
          background: `radial-gradient(120% 80% at 20% 10%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 55%),
                       radial-gradient(120% 80% at 100% 100%, ${instrument.accent}55 0%, ${instrument.accent}00 55%),
                       linear-gradient(180deg, #ffffff 0%, #e9ecf2 100%)`
        }}
      >
        <div
          className="absolute left-3 top-3 h-8 w-8 rounded-md"
          style={{
            background: `radial-gradient(circle at 30% 25%, #fff 0%, ${instrument.accent} 75%)`,
            boxShadow: `0 0 16px ${instrument.accent}66`
          }}
        />
        <span className="absolute right-3 top-3 rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-surface-600">
          {instrument.uiKind === "mpc" ? "MPC" : instrument.uiKind === "guitar-neck" ? "Guitar" : instrument.uiKind === "orchestral-stage" ? "Stage" : instrument.uiKind === "keyboard-strip" ? "Keys" : instrument.uiKind === "synth-panel" ? "Synth" : "Browser"}
        </span>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-white">
            {instrument.family}
          </span>
          <span className="text-[10px] text-surface-500">
            {instrument.sizeMb >= 1000
              ? `${(instrument.sizeMb / 1000).toFixed(1)} GB`
              : `${instrument.sizeMb} MB`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-surface-900">
            {instrument.name}
          </span>
          <span className="label-tiny">{instrument.category}</span>
        </div>
        <span className={clsx("text-[11px] leading-snug text-surface-500", !active && "group-hover:text-surface-700")}>
          {instrument.tagline}
        </span>
        <div className="mt-1 flex flex-wrap gap-1">
          {instrument.presets.slice(0, 3).map((p) => (
            <span
              key={p.name}
              className="rounded-full border border-black/5 bg-surface-100 px-2 py-0.5 text-[9px] tracking-[0.12em] text-surface-600"
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
