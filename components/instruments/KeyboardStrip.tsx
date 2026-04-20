"use client";

import clsx from "clsx";
import type { VirtualInstrument } from "@/lib/instruments";
import { useAudioStore } from "@/lib/audio/audioStore";
import type { VoiceOptions } from "@/lib/audio/engine";

function timbreForInstrument(instrument: VirtualInstrument): VoiceOptions["timbre"] {
  switch (instrument.category) {
    case "bass": return "bass";
    case "keys": return "keys";
    case "synth": return "lead";
    case "pad":
    case "texture": return "pad";
    case "strings":
    case "orchestra":
    case "choir": return "strings";
    case "brass": return "brass";
    case "fx": return "fx";
    default: return "keys";
  }
}

/**
 * 88-key keyboard strip with range highlight. Used for keys, bass, synth,
 * guitar (as a fretboard surrogate), and orchestra patches. Every key press
 * fires a real voice through the audio engine.
 */
export function KeyboardStrip({
  instrument,
  onKeyDown
}: {
  instrument: VirtualInstrument;
  onKeyDown?: (midi: number) => void;
}) {
  const low = instrument.range?.low ?? 21;
  const high = instrument.range?.high ?? 108;
  const audition = useAudioStore((s) => s.audition);

  const fire = (midi: number) => {
    void audition(instrument.id, {
      note: midi,
      velocity: 0.9,
      duration: 0.6,
      timbre: timbreForInstrument(instrument)
    });
    onKeyDown?.(midi);
  };

  const keys: { midi: number; black: boolean }[] = [];
  for (let m = 21; m <= 108; m++) {
    const p = m % 12;
    const black = [1, 3, 6, 8, 10].includes(p);
    keys.push({ midi: m, black });
  }
  const whiteCount = keys.filter((k) => !k.black).length;

  return (
    <div
      className="relative h-[90px] w-full overflow-hidden rounded-md border border-surface-200 bg-white"
      data-testid="keyboard-strip"
    >
      <div className="relative flex h-full">
        {keys.filter((k) => !k.black).map((k, i) => {
          const inRange = k.midi >= low && k.midi <= high;
          return (
            <button
              key={k.midi}
              onMouseDown={() => fire(k.midi)}
              style={{ width: `${100 / whiteCount}%` }}
              className={clsx(
                "relative h-full border-r border-surface-200 bg-white transition",
                inRange ? "hover:bg-accent-blue/10" : "opacity-30"
              )}
            />
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 flex">
        {keys.filter((k) => !k.black).map((_, i) => null)}
      </div>
      {/* Black keys overlay */}
      <div className="pointer-events-auto absolute inset-0 flex">
        {keys.map((k, idx) => {
          if (!k.black) return null;
          // Position black key at the right edge of its preceding white key.
          const whiteIdx = keys.slice(0, idx).filter((x) => !x.black).length;
          const leftPct = (whiteIdx / whiteCount) * 100;
          const widthPct = (1 / whiteCount) * 60;
          const inRange = k.midi >= low && k.midi <= high;
          return (
            <button
              key={k.midi}
              onMouseDown={() => fire(k.midi)}
              style={{
                position: "absolute",
                left: `calc(${leftPct}% - ${widthPct / 2}%)`,
                width: `${widthPct}%`,
                top: 0,
                bottom: "40%"
              }}
              className={clsx(
                "rounded-b-md border border-black/30 bg-[#1a1c21] shadow-md",
                inRange ? "hover:bg-[#2e3138]" : "opacity-30"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
