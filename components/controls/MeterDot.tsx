"use client";

import clsx from "clsx";

interface MeterDotProps {
  level: number; // 0..1
  size?: number;
  className?: string;
}

/**
 * Single round LED-style meter indicator.
 * Green <= 0.7, amber 0.7..0.9, red > 0.9. Brightness scales with level.
 */
export function MeterDot({ level, size = 8, className }: MeterDotProps) {
  const clamped = Math.max(0, Math.min(1, level));
  const color =
    clamped > 0.92 ? "#E85C5C" : clamped > 0.78 ? "#E8B84F" : "#4CD07A";
  const intensity = 0.35 + clamped * 0.65;
  return (
    <span
      role="status"
      aria-label={`meter ${Math.round(clamped * 100)}%`}
      className={clsx("meter-dot inline-block rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: color,
        opacity: intensity,
        color
      }}
    />
  );
}

/** Vertical stack of dots, for compact ladder meters. */
export function MeterLadder({
  level,
  dots = 8,
  vertical = true
}: {
  level: number;
  dots?: number;
  vertical?: boolean;
}) {
  const active = Math.round(level * dots);
  const list = Array.from({ length: dots });
  return (
    <div
      className={clsx(
        "flex gap-[3px]",
        vertical ? "flex-col-reverse" : "flex-row"
      )}
    >
      {list.map((_, i) => {
        const on = i < active;
        const t = i / (dots - 1);
        const color =
          t > 0.88 ? "#E85C5C" : t > 0.72 ? "#E8B84F" : "#4CD07A";
        return (
          <span
            key={i}
            className="rounded-[2px]"
            style={{
              width: vertical ? 10 : 6,
              height: vertical ? 3 : 10,
              background: on ? color : "#D6DADF",
              boxShadow: on ? `0 0 4px ${color}88` : "none"
            }}
          />
        );
      })}
    </div>
  );
}
