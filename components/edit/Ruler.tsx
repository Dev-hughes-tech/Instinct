"use client";

import { useInstinct } from "@/lib/store";

interface RulerProps {
  bars?: number;
  pxPerBar?: number;
}

export function Ruler({ bars = 32, pxPerBar = 96 }: RulerProps) {
  const transport = useInstinct((s) => s.session.transport);
  const playheadBeats = transport.positionBeats;
  const [num] = transport.timeSig;

  return (
    <div
      className="relative h-7 flex-none border-b border-surface-200 bg-white/80 overflow-hidden"
      role="presentation"
    >
      <div
        className="relative h-full"
        style={{ width: bars * pxPerBar }}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const x = i * pxPerBar;
          return (
            <div key={i} className="absolute inset-y-0" style={{ left: x }}>
              <div className="absolute bottom-0 top-0 w-px bg-surface-200" />
              <div className="absolute left-1 top-1 text-[9px] tabular-nums text-surface-500">
                {i + 1}
              </div>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="absolute bottom-0 h-2 w-px bg-surface-150"
                  style={{ left: (pxPerBar / num) * s }}
                />
              ))}
            </div>
          );
        })}
        {/* playhead */}
        <div
          className="absolute inset-y-0 z-10 w-px bg-accent-blue"
          style={{ left: (playheadBeats / num) * pxPerBar }}
        >
          <div className="absolute -top-px -left-[4px] h-2 w-[9px] rounded-b-[3px] bg-accent-blue shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
        </div>
      </div>
    </div>
  );
}
