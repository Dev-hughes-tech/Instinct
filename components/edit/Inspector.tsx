"use client";

import { MousePointer2, Pencil, RectangleHorizontal, Scissors, TimerReset } from "lucide-react";
import clsx from "clsx";
import { useInstinct } from "@/lib/store";
import { formatDb, formatHz, formatPan } from "@/lib/format";
import { Knob } from "@/components/controls/Knob";
import { StatusPill } from "@/components/controls/StatusPill";

const tools = [
  { id: "select", Icon: MousePointer2, label: "Select" },
  { id: "range", Icon: RectangleHorizontal, label: "Range" },
  { id: "pencil", Icon: Pencil, label: "Pencil" },
  { id: "grabber", Icon: Scissors, label: "Slice" },
  { id: "scrub", Icon: TimerReset, label: "Scrub" }
] as const;

export function Inspector() {
  const session = useInstinct((s) => s.session);
  const setTool = useInstinct((s) => s.setTool);
  const { inspector, tracks, strips } = session;
  const track = tracks.find((t) => t.id === inspector.selectedTrackId) ?? tracks[0]!;
  const strip = strips.find((s) => s.trackId === track.id)!;
  const clip = track.clips.find((c) => c.id === inspector.selectedClipId) ?? track.clips[0];

  return (
    <aside
      data-testid="inspector"
      className="flex h-full w-[260px] flex-none flex-col gap-2 overflow-auto bg-surface-100 p-2"
    >
      <Card title="Tool">
        <div className="grid grid-cols-5 gap-1">
          {tools.map((t) => {
            const active = inspector.tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={clsx(
                  "flex h-9 items-center justify-center rounded-md border transition",
                  active
                    ? "bg-surface-900 text-white shadow-pop border-black/20"
                    : "panel-lift border-surface-200 text-surface-700"
                )}
                title={t.label}
              >
                <t.Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </Card>

      <Card title={`Track · ${track.name}`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="label-tiny">Input</span>
            <span className="num-readout text-[11px] text-surface-800">
              {track.inputLabel}
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="label-tiny">Output</span>
            <span className="num-readout text-[11px] text-surface-800">
              {track.outputLabel}
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 place-items-center gap-2">
          <Knob value={strip.fader} label="Gain" sublabel={formatDb(strip.fader)} />
          <Knob value={(strip.pan + 1) / 2} label="Pan" sublabel={formatPan(strip.pan)} bipolar />
          <Knob value={Math.min(1, strip.highpass / 500)} label="HPF" sublabel={formatHz(strip.highpass)} />
        </div>
      </Card>

      <Card title="Clip">
        {clip ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-surface-900">{clip.label}</span>
              <span className="num-readout text-[10px] text-surface-500">
                {clip.length.toFixed(1)} beats
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <StatusPill>FADE I</StatusPill>
              <StatusPill>FADE O</StatusPill>
              <StatusPill active>GAIN</StatusPill>
            </div>
            <div className="label-tiny mt-3">Automation summary</div>
            <div className="mt-1 flex h-16 items-center rounded-md border border-surface-200 bg-white px-2">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d="M0 30 C 15 10, 30 22, 45 18 S 75 30, 100 12"
                  stroke="#3E8BFF"
                  fill="none"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="text-xs text-surface-500">No clip selected.</div>
        )}
      </Card>

      <Card title="Snap · Grid">
        <div className="grid grid-cols-4 gap-1">
          {(["1/4", "1/8", "1/16", "1/32"] as const).map((g) => (
            <StatusPill key={g} active={inspector.grid === g}>
              {g}
            </StatusPill>
          ))}
        </div>
      </Card>
    </aside>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel-surface relative rounded-xl p-3">
      <div className="label-tiny mb-2">{title}</div>
      {children}
    </section>
  );
}
