"use client";

import { Knob } from "@/components/controls/Knob";
import { MeterLadder } from "@/components/controls/MeterDot";
import type { PluginDevice, PluginInstance } from "@/lib/types";

export function VCA3A({
  device,
  instance
}: {
  device: PluginDevice;
  instance: PluginInstance;
}) {
  const p = instance.parameters;
  return (
    <div className="chassis-champagne relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 grain">
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#5A3F18]">
          Architexure
        </span>
        <span className="text-[13px] font-semibold tracking-tight text-[#2E1E07]">
          VCA-3A
        </span>
        <span className="text-[8px] uppercase tracking-[0.15em] text-[#5A3F18]/80">
          Opto-Vari Compressor
        </span>
      </div>
      <div className="flex flex-1 items-center justify-evenly">
        <Knob size="sm" tone="dark" accent="#2E1E07" value={p.threshold ?? 0.5} label="PEAK" bipolar />
        <Knob size="sm" tone="dark" accent="#2E1E07" value={p.ratio ?? 0.6} label="GAIN" />
        <Knob size="xs" tone="dark" accent="#2E1E07" value={p.attack ?? 0.3} label="ATK" />
        <Knob size="xs" tone="dark" accent="#2E1E07" value={p.release ?? 0.5} label="REL" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <MeterLadder level={0.55} dots={6} vertical={false} />
        <span className="text-[8px] uppercase tracking-[0.18em] text-[#5A3F18]">
          GR
        </span>
      </div>
    </div>
  );
}
