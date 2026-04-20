"use client";

import clsx from "clsx";
import { useId } from "react";

interface KnobProps {
  value: number; // 0..1
  label?: string;
  sublabel?: string;
  size?: "xs" | "sm" | "md" | "lg";
  accent?: string;
  tone?: "chrome" | "dark" | "accent";
  bipolar?: boolean;
  onChange?: (v: number) => void;
  ariaLabel?: string;
}

const sizes = {
  xs: 22,
  sm: 30,
  md: 38,
  lg: 48
} as const;

/**
 * Premium rotary control. Visual-only interaction (no drag math), but
 * renders a hardware-looking indicator + arc. Kept small & fast.
 */
export function Knob({
  value,
  label,
  sublabel,
  size = "md",
  accent = "#3E8BFF",
  tone = "chrome",
  bipolar,
  ariaLabel
}: KnobProps) {
  const id = useId();
  const pct = Math.max(0, Math.min(1, value));
  const dim = sizes[size];
  // Arc from -135° .. +135°
  const startAngle = -135;
  const endAngle = 135;
  const indicatorAngle = startAngle + pct * (endAngle - startAngle);
  const arcStart = bipolar ? 0 : startAngle;
  const arcTo = bipolar ? indicatorAngle : indicatorAngle;

  const radius = dim / 2 - 2;

  return (
    <div
      className="flex flex-col items-center gap-1 select-none"
      aria-label={ariaLabel ?? label}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Math.round(pct * 100) / 100}
    >
      <div
        className="relative"
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox={`0 0 ${dim} ${dim}`}
          className="absolute inset-0"
        >
          <defs>
            <radialGradient id={`knob-face-${id}`} cx="32%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#eef0f3" />
              <stop offset="100%" stopColor="#cdd2d8" />
            </radialGradient>
            <radialGradient id={`knob-dark-${id}`} cx="32%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#3c4148" />
              <stop offset="100%" stopColor="#14161a" />
            </radialGradient>
          </defs>
          {/* Arc track */}
          <Arc
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            startDeg={startAngle}
            endDeg={endAngle}
            stroke="rgba(20,22,26,0.1)"
            width={2}
          />
          {/* Arc filled */}
          <Arc
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            startDeg={arcStart}
            endDeg={arcTo}
            stroke={accent}
            width={2.25}
          />
          {/* Cap */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius - 3}
            fill={
              tone === "dark"
                ? `url(#knob-dark-${id})`
                : `url(#knob-face-${id})`
            }
            stroke="rgba(20,22,26,0.18)"
          />
          {/* Indicator line */}
          <IndicatorLine
            cx={dim / 2}
            cy={dim / 2}
            r={radius - 4}
            deg={indicatorAngle}
            color={tone === "dark" ? "#ffffff" : "#2B2F34"}
          />
        </svg>
      </div>
      {(label || sublabel) && (
        <div className="text-center leading-none">
          {label && (
            <div className="label-tiny whitespace-nowrap">{label}</div>
          )}
          {sublabel && (
            <div className={clsx("num-readout text-[10px] text-surface-700 mt-0.5")}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function Arc({
  cx,
  cy,
  r,
  startDeg,
  endDeg,
  stroke,
  width
}: {
  cx: number;
  cy: number;
  r: number;
  startDeg: number;
  endDeg: number;
  stroke: string;
  width: number;
}) {
  if (Math.abs(endDeg - startDeg) < 0.01) return null;
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
    />
  );
}

function IndicatorLine({
  cx,
  cy,
  r,
  deg,
  color
}: {
  cx: number;
  cy: number;
  r: number;
  deg: number;
  color: string;
}) {
  const inner = polar(cx, cy, r * 0.4, deg);
  const outer = polar(cx, cy, r * 0.92, deg);
  return (
    <line
      x1={inner.x}
      y1={inner.y}
      x2={outer.x}
      y2={outer.y}
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  );
}
