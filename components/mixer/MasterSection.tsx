"use client";

import type { MasterBus } from "@/lib/types";
import { Fader } from "@/components/controls/Fader";
import { Knob } from "@/components/controls/Knob";
import { MeterLadder } from "@/components/controls/MeterDot";
import { InsertSlotView } from "@/components/controls/InsertSlot";
import { formatDb } from "@/lib/format";

export function MasterSection({ master }: { master: MasterBus }) {
  const s = master.strip;
  return (
    <section
      data-testid="master-section"
      className="strip-face flex h-full w-[220px] flex-none flex-col gap-2 rounded-xl p-2"
    >
      <div className="flex items-center justify-between">
        <span className="label-tiny">Master</span>
        <span className="num-readout text-[10px] text-surface-700">
          {s.outputLabel}
        </span>
      </div>

      <div className="panel-sunken grid grid-cols-3 place-items-center gap-1 rounded-md p-1.5">
        <Knob size="sm" value={0.6} label="DIM" />
        <Knob size="sm" value={0.7} label="MONO" bipolar />
        <Knob size="sm" value={0.5} label="REF" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="label-tiny">Master Inserts</div>
        {s.inserts.slice(0, 5).map((slot) => (
          <InsertSlotView key={slot.id} slot={slot} />
        ))}
      </div>

      <div className="flex flex-1 items-end justify-center gap-3">
        <Fader value={s.fader} readout={formatDb(s.fader)} height={220} accent="#2B2F34" />
        <div className="flex h-full flex-col items-center justify-end gap-1.5">
          <MeterLadder level={s.meter.peak} dots={20} />
          <span className="label-tiny">L</span>
        </div>
        <div className="flex h-full flex-col items-center justify-end gap-1.5">
          <MeterLadder level={s.meter.rms} dots={20} />
          <span className="label-tiny">R</span>
        </div>
      </div>

      <div className="panel-lift grid grid-cols-2 gap-1 rounded-md p-1.5 text-center">
        <span className="num-readout text-[11px] text-surface-800">-0.3</span>
        <span className="num-readout text-[11px] text-surface-800">-0.5</span>
        <span className="label-tiny">PEAK L</span>
        <span className="label-tiny">PEAK R</span>
      </div>
    </section>
  );
}
