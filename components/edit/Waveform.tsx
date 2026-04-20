"use client";

import type { WaveformClip } from "@/lib/types";

interface WaveformProps {
  clip: WaveformClip;
  color: string;
  height: number;
  pxPerBar: number;
  beatsPerBar: number;
}

/**
 * SVG waveform. Rendered as a filled mirrored polygon with subtle internal
 * stem shading. Color is strictly kept *inside* the clip bounds — no external
 * glow — per the locked UI direction.
 */
export function Waveform({ clip, color, height, pxPerBar, beatsPerBar }: WaveformProps) {
  const lengthPx = (clip.length / beatsPerBar) * pxPerBar;
  const leftPx = (clip.start / beatsPerBar) * pxPerBar;
  const padY = 8;
  const midY = height / 2;
  const maxAmp = (height - padY * 2) / 2;

  // Build polygon points
  const pts = clip.peaks.length;
  const stride = Math.max(1, Math.floor(pts / Math.max(24, lengthPx / 2)));
  const topPath: string[] = [];
  const botPath: string[] = [];
  for (let i = 0; i < pts; i += stride) {
    const x = (i / (pts - 1)) * lengthPx;
    const a = clip.peaks[i]! * maxAmp;
    topPath.push(`${x.toFixed(1)},${(midY - a).toFixed(1)}`);
    botPath.unshift(`${x.toFixed(1)},${(midY + a).toFixed(1)}`);
  }

  const d = `M ${topPath.join(" L ")} L ${botPath.join(" L ")} Z`;

  return (
    <div
      className="absolute overflow-hidden rounded-md"
      style={{
        left: leftPx,
        width: lengthPx,
        top: 4,
        height: height - 8,
        background: `linear-gradient(180deg, ${color}22 0%, ${color}10 100%)`,
        border: `1px solid ${color}55`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(20,22,26,0.06)"
      }}
    >
      {/* clip header */}
      <div
        className="absolute left-0 right-0 top-0 flex h-[14px] items-center gap-1 px-1.5 text-[9px] uppercase tracking-[0.12em] text-surface-700"
        style={{
          background: `linear-gradient(180deg, ${color}88 0%, ${color}44 100%)`
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
        <span className="truncate">{clip.label}</span>
      </div>
      <svg
        width={lengthPx}
        height={height - 8 - 14}
        viewBox={`0 0 ${lengthPx} ${height - 8 - 14}`}
        style={{ position: "absolute", top: 14, left: 0 }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`wg-${clip.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="50%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <g transform={`translate(0, ${-14})`}>
          <path d={d} fill={`url(#wg-${clip.id})`} stroke={color} strokeWidth={0.6} />
        </g>
      </svg>
    </div>
  );
}
