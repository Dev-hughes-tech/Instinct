"use client";

import clsx from "clsx";
import { useInstinct } from "@/lib/store";
import { EDIT_ROW_GAP, EDIT_ROW_HEIGHT, trackColor } from "@/lib/theme";
import { StatusPill } from "@/components/controls/StatusPill";
import { MeterDot } from "@/components/controls/MeterDot";
import type { Track } from "@/lib/types";

export function TrackPanel() {
  const tracks = useInstinct((s) => s.session.tracks);
  const strips = useInstinct((s) => s.session.strips);
  const selectedTrackId = useInstinct((s) => s.session.inspector.selectedTrackId);
  const selectTrack = useInstinct((s) => s.selectTrack);

  return (
    <div
      data-testid="track-panel"
      className="flex h-full flex-col gap-[6px] overflow-hidden bg-surface-100 p-2"
      style={{ width: 288 }}
    >
      <PanelHeader />
      <div className="flex flex-col gap-[6px]">
        {tracks.map((t, i) => {
          const strip = strips[i]!;
          return (
            <TrackRow
              key={t.id}
              track={t}
              selected={selectedTrackId === t.id}
              onSelect={() => selectTrack(t.id)}
              meterLevel={strip.meter.peak}
            />
          );
        })}
      </div>
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="flex h-6 items-center justify-between px-1">
      <span className="label-tiny">Tracks</span>
      <span className="label-tiny">IN · FX · OUT</span>
    </div>
  );
}

function TrackRow({
  track,
  selected,
  onSelect,
  meterLevel
}: {
  track: Track;
  selected: boolean;
  onSelect: () => void;
  meterLevel: number;
}) {
  const c = trackColor(track.colorKey);
  return (
    <button
      type="button"
      data-testid={`track-row-${track.id}`}
      onClick={onSelect}
      className={clsx(
        "strip-face relative flex items-stretch overflow-hidden rounded-lg text-left",
        selected && "row-selected"
      )}
      style={{ height: EDIT_ROW_HEIGHT }}
    >
      {/* color rail */}
      <div
        className="w-[6px] flex-none"
        style={{
          background: `linear-gradient(180deg, ${c}, ${c}99)`
        }}
      />
      <div className="flex flex-1 items-center gap-2 px-2">
        {/* number + name */}
        <div className="flex w-[82px] flex-none flex-col leading-tight">
          <span className="label-tiny">{String(track.index + 1).padStart(2, "0")}</span>
          <span className="text-[12.5px] font-medium tracking-tight text-surface-900">
            {track.name}
          </span>
        </div>
        {/* IO */}
        <div className="flex w-[66px] flex-none flex-col gap-1 text-[9px]">
          <span className="label-tiny">IN</span>
          <span className="num-readout text-[10px] text-surface-700">{track.inputLabel}</span>
          <span className="label-tiny">OUT</span>
          <span className="num-readout text-[10px] text-surface-700">{track.outputLabel}</span>
        </div>
        {/* inserts + sends summary */}
        <div className="flex flex-1 flex-col gap-1">
          <div className="label-tiny">FX · SENDS</div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < track.insertIds.length;
              return (
                <span
                  key={i}
                  className={clsx(
                    "h-[6px] w-full rounded-[2px]",
                    filled ? "bg-surface-800" : "bg-surface-200"
                  )}
                />
              );
            })}
          </div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={clsx(
                  "h-[3px] w-full rounded-[2px]",
                  i < 3 ? "bg-accent-blue/70" : "bg-surface-200"
                )}
              />
            ))}
          </div>
        </div>
        {/* controls */}
        <div className="flex flex-none flex-col items-end gap-1 pr-1">
          <div className="flex gap-1">
            <StatusPill tone="record" active={track.armed} title="Record arm">
              R
            </StatusPill>
            <StatusPill tone="solo" active={track.solo} title="Solo">
              S
            </StatusPill>
            <StatusPill tone="mute" active={track.mute} title="Mute">
              M
            </StatusPill>
          </div>
          <div className="flex items-center gap-1.5">
            <MeterDot level={meterLevel} size={6} />
            <MeterDot level={meterLevel * 0.85} size={6} />
          </div>
        </div>
      </div>
    </button>
  );
}
