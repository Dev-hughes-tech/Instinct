"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Headphones, Play, Square, Volume2 } from "lucide-react";
import { useAudioStore } from "@/lib/audio/audioStore";
import type { VoiceOptions } from "@/lib/audio/engine";

/**
 * Universal per-instrument audition bar. Sits inside InstrumentDetail and any
 * other surface that needs a "hear it now" button (drum machine, preset row,
 * instrument card popover). It starts the audio engine on first user gesture
 * and plays a real voice through the master output.
 */
export function AuditionChannel({
  instrumentId,
  noteSequence = [60, 64, 67, 72],
  timbre = "keys",
  label = "Audition",
  compact = false
}: {
  instrumentId: string;
  noteSequence?: number[];
  timbre?: VoiceOptions["timbre"];
  label?: string;
  compact?: boolean;
}) {
  const audition = useAudioStore((s) => s.audition);
  const masterLevel = useAudioStore((s) => s.masterLevel);
  const start = useAudioStore((s) => s.start);
  const ready = useAudioStore((s) => s.ready);
  const backend = useAudioStore((s) => s.backend);
  const sampleRate = useAudioStore((s) => s.sampleRate);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);

  useEffect(() => {
    if (!ready) void start();
  }, [ready, start]);

  const play = async () => {
    setPlaying(true);
    let t = 0;
    for (const note of noteSequence) {
      window.setTimeout(() => {
        void audition(instrumentId, {
          note,
          velocity: 0.9,
          duration: 0.45,
          gain: volume,
          timbre
        });
      }, t);
      t += 180;
    }
    window.setTimeout(() => setPlaying(false), t + 400);
  };

  const stop = () => {
    setPlaying(false);
  };

  const peakPct = Math.min(1, masterLevel.peak * 1.4) * 100;

  if (compact) {
    return (
      <button
        data-testid="audition-compact"
        onClick={play}
        className="flex h-7 items-center gap-1 rounded-md border border-surface-200 bg-white px-2 text-[11px] text-surface-700 hover:bg-surface-50"
      >
        <Headphones className="h-3 w-3" /> {label}
      </button>
    );
  }

  return (
    <div
      data-testid="audition-channel"
      className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-3 py-2"
    >
      <button
        onClick={playing ? stop : play}
        className={clsx(
          "flex h-8 items-center gap-1 rounded-md border border-black/15 px-3 text-[11px] font-medium uppercase tracking-[0.1em]",
          playing
            ? "bg-gradient-to-b from-surface-900 to-black text-white"
            : "bg-white text-surface-900 hover:bg-surface-50"
        )}
      >
        {playing ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
        {playing ? "Stop" : label}
      </button>

      <Headphones className="h-4 w-4 text-surface-400" />
      <div className="flex flex-col gap-1">
        <div className="relative h-1.5 w-36 overflow-hidden rounded-full bg-surface-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-500 transition-[width] duration-75"
            style={{ width: `${peakPct}%` }}
          />
        </div>
        <span className="text-[9px] uppercase tracking-[0.12em] text-surface-500">
          {backend === "coreaudio" ? "Core Audio" : "WebAudio"} · {(sampleRate / 1000).toFixed(1)} kHz
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Volume2 className="h-3 w-3 text-surface-500" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 accent-black"
          aria-label="Audition volume"
        />
      </div>
    </div>
  );
}
