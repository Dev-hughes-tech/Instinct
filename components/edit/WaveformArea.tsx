"use client";

import { useInstinct } from "@/lib/store";
import { EDIT_ROW_GAP, EDIT_ROW_HEIGHT, trackColor } from "@/lib/theme";
import { Ruler } from "./Ruler";
import { Waveform } from "./Waveform";
import type { Track } from "@/lib/types";

const BEATS_PER_BAR = 4;
const PX_PER_BAR = 96;
const BARS = 40;

export function WaveformArea() {
  const tracks = useInstinct((s) => s.session.tracks);
  const selectedTrackId = useInstinct((s) => s.session.inspector.selectedTrackId);
  const selectClip = useInstinct((s) => s.selectClip);

  return (
    <div data-testid="waveform-area" className="flex h-full flex-col overflow-hidden bg-surface-50">
      <div className="flex-none overflow-x-auto">
        <Ruler bars={BARS} pxPerBar={PX_PER_BAR} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div
          className="relative flex flex-col gap-[6px] p-2"
          style={{ minWidth: BARS * PX_PER_BAR + 16 }}
        >
          {tracks.map((t) => (
            <WaveLane
              key={t.id}
              track={t}
              selected={selectedTrackId === t.id}
              onSelectClip={selectClip}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WaveLane({
  track,
  selected,
  onSelectClip
}: {
  track: Track;
  selected: boolean;
  onSelectClip: (id: string | null) => void;
}) {
  const color = trackColor(track.colorKey);
  return (
    <div
      data-testid={`wave-lane-${track.id}`}
      className="panel-lift relative overflow-hidden rounded-lg"
      style={{
        height: EDIT_ROW_HEIGHT,
        boxShadow: selected
          ? `0 0 0 1.5px ${color}66 inset, 0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(20,22,26,0.06)`
          : undefined
      }}
    >
      {/* grid */}
      <div className="absolute inset-0 opacity-60">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-y-0 w-px bg-surface-200"
            style={{ left: i * PX_PER_BAR }}
          />
        ))}
      </div>
      {track.clips.map((clip) => (
        <div
          key={clip.id}
          onClick={() => onSelectClip(clip.id)}
          role="button"
          tabIndex={0}
          className="absolute inset-y-0"
        >
          <Waveform
            clip={clip}
            color={color}
            height={EDIT_ROW_HEIGHT}
            pxPerBar={PX_PER_BAR}
            beatsPerBar={BEATS_PER_BAR}
          />
        </div>
      ))}
    </div>
  );
}
