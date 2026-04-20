"use client";

import { Knob } from "@/components/controls/Knob";
import type { PluginDevice, PluginInstance } from "@/lib/types";

export function BC2({
  device,
  instance
}: {
  device: PluginDevice;
  instance: PluginInstance;
}) {
  const p = instance.parameters;
  return (
    <div className="chassis-porcelain relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 grain">
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.2em] text-surface-500">
          Architexure
        </span>
        <span className="text-[13px] font-semibold tracking-tight text-surface-900">
          BC-2
        </span>
        <span className="text-[8px] uppercase tracking-[0.15em] text-surface-500">
          Bloom Channel Strip
        </span>
      </div>
      <div className="flex flex-1 items-center justify-evenly">
        <Knob size="xs" value={p.hp ?? 0.2} label="HP" />
        <Knob size="xs" value={p.lf ?? 0.55} label="LF" bipolar />
        <Knob size="xs" value={p.lmf ?? 0.5} label="LMF" bipolar />
        <Knob size="xs" value={p.hmf ?? 0.58} label="HMF" bipolar />
        <Knob size="xs" value={p.hf ?? 0.65} label="HF" bipolar />
        <Knob size="sm" accent="#7E9FD9" value={p.drive ?? 0.3} label="DRIVE" />
      </div>
    </div>
  );
}
