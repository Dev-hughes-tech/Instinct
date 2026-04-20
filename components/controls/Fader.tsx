"use client";

import clsx from "clsx";

interface FaderProps {
  value: number; // 0..1
  height?: number;
  accent?: string;
  label?: string;
  readout?: string;
  onChange?: (v: number) => void;
}

const TICKS = [
  { y: 0, label: "+12" },
  { y: 0.12, label: "+6" },
  { y: 0.24, label: "0" },
  { y: 0.42, label: "-6" },
  { y: 0.6, label: "-12" },
  { y: 0.78, label: "-24" },
  { y: 0.96, label: "∞" }
];

/**
 * Console-style vertical fader. Visual. The cap slides based on value.
 * Scale: 0 (bottom) .. 1 (top). "Unity" visually sits around 0.75.
 */
export function Fader({
  value,
  height = 160,
  accent = "#3E8BFF",
  label,
  readout
}: FaderProps) {
  const capHeight = 22;
  const usableTrack = height - capHeight;
  // capY is top coord of cap
  const capY = (1 - value) * usableTrack;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-start justify-center"
        style={{ width: 46, height }}
      >
        {/* Tick marks */}
        <div className="absolute inset-y-1 left-1 flex flex-col justify-between text-[8px] text-surface-400">
          {TICKS.map((t) => (
            <span
              key={t.label}
              className={clsx("tabular-nums")}
              style={{
                position: "absolute",
                top: `${t.y * 100}%`,
                transform: "translateY(-50%)"
              }}
            >
              {t.label}
            </span>
          ))}
        </div>

        {/* Track */}
        <div
          className="fader-track absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
          style={{ width: 6, height }}
        />

        {/* Filled bar below cap */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 4,
            top: capY + capHeight / 2,
            height: height - (capY + capHeight / 2) - 4,
            background: `linear-gradient(180deg, ${accent}66, ${accent}1a)`
          }}
        />

        {/* Cap */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-[6px]"
          style={{
            top: capY,
            width: 30,
            height: capHeight,
            background:
              "linear-gradient(180deg, #ffffff 0%, #e7eaee 50%, #c9ced4 100%)",
            border: "1px solid rgba(20,22,26,0.18)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(20,22,26,0.1) inset, 0 2px 4px rgba(20,22,26,0.12)"
          }}
        >
          <div className="mx-auto mt-[10px] h-[1px] w-5 bg-[rgba(20,22,26,0.3)]" />
        </div>
      </div>
      {readout && (
        <div className="num-readout mt-1 text-[10px] text-surface-700">{readout}</div>
      )}
      {label && <div className="label-tiny mt-0.5">{label}</div>}
    </div>
  );
}
