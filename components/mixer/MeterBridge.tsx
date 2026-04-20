"use client";

import { MeterLadder } from "@/components/controls/MeterDot";
import { trackColor } from "@/lib/theme";
import type { MixerStrip } from "@/lib/types";

export function MeterBridge({
  strips,
  master
}: {
  strips: MixerStrip[];
  master: MixerStrip;
}) {
  return (
    <section
      data-testid="meter-bridge"
      className="panel-surface relative flex h-[86px] flex-none items-stretch overflow-hidden rounded-xl px-1.5 py-1"
    >
      <div className="label-tiny mr-3 flex w-8 flex-none flex-col justify-center text-center">
        Meter
        <span className="mt-0.5 tracking-widest">Bridge</span>
      </div>
      <div className="flex flex-1 items-end gap-[6px]">
        {strips.map((s) => (
          <MeterColumn
            key={s.id}
            label={s.label}
            color={trackColor(s.colorKey as never)}
            level={s.meter.peak}
            sub={s.meter.rms}
          />
        ))}
      </div>
      <div className="mx-2 h-full w-px bg-surface-200" />
      <div className="flex items-end gap-[6px] pr-2">
        <MeterColumn
          label="MASTER L"
          color="#2B2F34"
          level={master.meter.peak}
          sub={master.meter.rms}
          wide
        />
        <MeterColumn
          label="MASTER R"
          color="#2B2F34"
          level={master.meter.rms}
          sub={master.meter.peak}
          wide
        />
      </div>
    </section>
  );
}

function MeterColumn({
  label,
  color,
  level,
  sub,
  wide
}: {
  label: string;
  color: string;
  level: number;
  sub: number;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "flex w-[48px] flex-col items-center" : "flex w-[60px] flex-col items-center"}>
      <div className="flex items-end gap-0.5">
        <MeterLadder level={level} dots={18} />
        <MeterLadder level={sub} dots={18} />
      </div>
      <span
        className="mt-1 block w-full truncate text-center text-[8px] font-medium uppercase tracking-[0.08em]"
        style={{ color }}
        title={label}
      >
        {label}
      </span>
    </div>
  );
}
