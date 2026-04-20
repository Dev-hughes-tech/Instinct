"use client";

import { Knob } from "@/components/controls/Knob";
import type { PluginDevice, PluginInstance } from "@/lib/types";
import clsx from "clsx";

const CHASSIS_CLASS: Record<PluginDevice["chassis"], string> = {
  silver: "chassis-metal",
  champagne: "chassis-champagne",
  porcelain: "chassis-porcelain",
  obsidian: "chassis-obsidian text-white",
  holographic: "chassis-holographic text-white"
};

export function GenericDevice({
  device,
  instance
}: {
  device: PluginDevice;
  instance: PluginInstance;
}) {
  const params = Object.entries(instance.parameters).slice(0, 4);
  const dark = device.chassis === "obsidian" || device.chassis === "holographic";
  return (
    <div
      className={clsx(
        "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 grain",
        CHASSIS_CLASS[device.chassis]
      )}
    >
      <div className="flex flex-col">
        <span className={clsx("text-[9px] uppercase tracking-[0.2em]", dark ? "text-white/60" : "text-surface-500")}>
          {device.family}
        </span>
        <span className={clsx("text-[13px] font-semibold tracking-tight", dark ? "text-white" : "text-surface-900")}>
          {device.name.replace("Architexure ", "")}
        </span>
        <span className={clsx("text-[8px] uppercase tracking-[0.15em]", dark ? "text-white/60" : "text-surface-500")}>
          {device.category}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-evenly">
        {params.map(([name, val]) => (
          <Knob
            key={name}
            size="xs"
            tone={dark ? "dark" : "chrome"}
            accent={device.accent}
            value={val}
            label={name.toUpperCase()}
          />
        ))}
      </div>
    </div>
  );
}
