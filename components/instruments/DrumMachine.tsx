"use client";

import clsx from "clsx";
import { Fragment, useEffect } from "react";
import { Play, Repeat, Sparkles, Trash2, Pause } from "lucide-react";
import type { VirtualInstrument, InstrumentPad } from "@/lib/instruments";
import { useInstruments } from "@/lib/instrumentsStore";
import { useAudioStore } from "@/lib/audio/audioStore";
import { AuditionChannel } from "@/components/audio/AuditionChannel";

/** Map a pad's category tag onto the engine's timbre palette. */
function padTimbre(pad: InstrumentPad): "kick" | "snare" | "hat" | "clap" | "perc" {
  const label = pad.label.toLowerCase();
  if (/(kick|bd|808)/.test(label)) return "kick";
  if (/(snare|sd|rim)/.test(label)) return "snare";
  if (/(hat|hh|cymbal|ride)/.test(label)) return "hat";
  if (/(clap|snap)/.test(label)) return "clap";
  return "perc";
}

/**
 * MPC-family drum machine UI. 4×4 pad grid on the left, step sequencer on
 * the right, transport + swing + BPM on the bottom strip.
 *
 * MPC numbering: pad 1 is bottom-left. We render rows bottom-to-top so the
 * visual layout matches a real MPC.
 */
export function DrumMachine({ instrument }: { instrument: VirtualInstrument }) {
  const hits = useInstruments((s) => s.hits);
  const hitPad = useInstruments((s) => s.hitPad);
  const clearHit = useInstruments((s) => s.clearHit);
  const pattern = useInstruments((s) => s.pattern);
  const toggleStep = useInstruments((s) => s.toggleStep);
  const accentStep = useInstruments((s) => s.accentStep);
  const clearPattern = useInstruments((s) => s.clearPattern);
  const setBpm = useInstruments((s) => s.setBpm);
  const setSwing = useInstruments((s) => s.setSwing);
  const startStop = useInstruments((s) => s.startStop);
  const tick = useInstruments((s) => s.tick);
  const audition = useAudioStore((s) => s.audition);

  const firePad = (pad: InstrumentPad, velocity = 0.95) => {
    hitPad(pad.id);
    void audition(instrument.id, {
      note: pad.note,
      velocity,
      duration: 0.15,
      timbre: padTimbre(pad),
      gain: pad.volume
    });
    setTimeout(() => clearHit(pad.id), 180);
  };

  // Pattern tick — (60_000 / bpm) / 4 ms per 16th note
  useEffect(() => {
    if (!pattern.running) return;
    const stepMs = 60_000 / pattern.bpm / 4;
    const id = setInterval(tick, stepMs);
    return () => clearInterval(id);
  }, [pattern.running, pattern.bpm, tick]);

  // Flash pads on playhead if their step is on — AND fire the voice through
  // the audio engine so the sequencer is actually audible.
  useEffect(() => {
    if (!pattern.running || !instrument.pads) return;
    instrument.pads.forEach((pad, padIdx) => {
      const cell = pattern.grid[padIdx]?.[pattern.playhead];
      if (cell?.on) {
        const velocity = cell.accent ? 1 : 0.75;
        firePad(pad, velocity);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.playhead, pattern.running]);

  if (!instrument.pads) return null;

  const padsRows: InstrumentPad[][] = [];
  for (let r = 3; r >= 0; r--) {
    padsRows.push(instrument.pads.slice(r * 4, r * 4 + 4));
  }

  return (
    <div
      data-testid="drum-machine"
      className="flex h-full w-full flex-col overflow-hidden rounded-xl chassis-obsidian p-3 text-white"
    >
      <header className="flex items-center gap-3 pb-3">
        <div
          className="h-9 w-9 rounded-md"
          style={{
            background: `radial-gradient(circle at 30% 30%, #fff 0%, ${instrument.accent} 70%)`,
            boxShadow: `0 0 20px ${instrument.accent}55`
          }}
        />
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            {instrument.family} · Drum Machine
          </div>
          <div className="text-[15px] font-semibold">{instrument.name}</div>
        </div>
        <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-white/40">
          {instrument.library.fileCount.toLocaleString()} samples · {instrument.library.velocityLayers} vel layers
        </span>
      </header>

      <div className="pb-3">
        <AuditionChannel
          instrumentId={instrument.id}
          noteSequence={(instrument.pads ?? []).slice(0, 4).map((p) => p.note)}
          timbre="perc"
          label="Audition Kit"
        />
      </div>

      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* LEFT — 4×4 pad bank */}
        <section className="flex w-[360px] flex-none flex-col gap-2">
          <div className="flex flex-col gap-2">
            {padsRows.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-4 gap-2">
                {row.map((pad, cIdx) => {
                  const padNumber = (3 - rIdx) * 4 + cIdx + 1;
                  const hit = hits[pad.id] !== undefined;
                  return (
                    <button
                      key={pad.id}
                      data-testid={`pad-${pad.id}`}
                      data-hit={hit}
                      style={
                        {
                          "--pad-accent": instrument.accent,
                          "--pad-accent-dark": instrument.chassis === "obsidian" ? "#222" : "#8F6F2D"
                        } as React.CSSProperties
                      }
                      onMouseDown={() => firePad(pad, 0.95)}
                      className="mpc-pad flex h-[70px] flex-col items-start justify-between rounded-md p-2 text-left"
                    >
                      <span className="text-[9px] uppercase tracking-[0.15em] opacity-70">
                        P{String(padNumber).padStart(2, "0")}
                      </span>
                      <span className="text-[11px] font-medium">{pad.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="panel-sunken mt-1 rounded-md p-2 text-[10px] text-surface-600">
            <div className="flex justify-between">
              <span className="label-tiny text-surface-500">Root Sample URI</span>
              <span className="truncate pl-2 text-surface-800">
                {instrument.library.rootUri}
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT — step sequencer */}
        <section className="flex flex-1 flex-col gap-2 rounded-md bg-black/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">
              Step Sequencer · 16 Steps
            </span>
            <div className="flex items-center gap-1 text-[10px] text-white/50">
              <span>BAR 1 · 4/4 · 1/16</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto rounded-md bg-black/30 p-2">
            <div className="grid" style={{ gridTemplateColumns: "92px repeat(16, minmax(18px, 1fr))", gap: "4px" }}>
              {instrument.pads.map((pad, padIdx) => (
                <Fragment key={pad.id}>
                  <div
                    className="flex items-center gap-1 text-[10px] text-white/70"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: pad.color }}
                    />
                    <span className="truncate">{pad.label}</span>
                  </div>
                  {Array.from({ length: pattern.stepCount }).map((_, stepIdx) => {
                    const cell = pattern.grid[padIdx]?.[stepIdx];
                    const isBeat = stepIdx % 4 === 0;
                    const isPlayhead = pattern.running && pattern.playhead === stepIdx;
                    return (
                      <button
                        key={`${pad.id}-${stepIdx}`}
                        data-testid={`step-${padIdx}-${stepIdx}`}
                        data-on={cell?.on ? true : false}
                        data-accent={cell?.accent ? true : false}
                        data-beat={isBeat}
                        onClick={(e) => {
                          if (e.shiftKey) accentStep(padIdx, stepIdx);
                          else toggleStep(padIdx, stepIdx);
                        }}
                        className={clsx(
                          "step-cell h-6 rounded-[4px]",
                          isPlayhead && "ring-2 ring-white/40"
                        )}
                        aria-label={`Toggle step ${stepIdx + 1} on ${pad.label}`}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/50 p-2">
            <button
              onClick={startStop}
              className={clsx(
                "flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-medium",
                pattern.running
                  ? "bg-red-500 text-white"
                  : "bg-white/15 text-white hover:bg-white/25"
              )}
            >
              {pattern.running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {pattern.running ? "Stop" : "Play"}
            </button>
            <button
              onClick={clearPattern}
              className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1.5 text-[11px] text-white/80 hover:bg-white/20"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
            <label className="flex items-center gap-1 text-[10px] text-white/60">
              BPM
              <input
                type="number"
                value={pattern.bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-14 rounded bg-black/40 px-1 py-0.5 text-[11px] text-white outline-none"
              />
            </label>
            <label className="ml-2 flex items-center gap-1 text-[10px] text-white/60">
              Swing
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(pattern.swing * 100)}
                onChange={(e) => setSwing(Number(e.target.value) / 100)}
                className="w-24 accent-white/70"
              />
              <span className="num-readout w-8 text-right text-white/80">
                {Math.round(pattern.swing * 100)}%
              </span>
            </label>
            <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/50">
              <Repeat className="h-3 w-3" /> Loop · BAR 1
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <Sparkles className="h-3 w-3 text-accent-violet" /> Michael AI Groove
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
