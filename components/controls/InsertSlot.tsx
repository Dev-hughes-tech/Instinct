"use client";

import clsx from "clsx";
import { Plus } from "lucide-react";
import type { InsertSlot as InsertSlotData } from "@/lib/types";
import { mockSession } from "@/lib/mockData";

function resolveDevice(pluginInstanceId: string | undefined) {
  if (!pluginInstanceId) return null;
  const inst = mockSession.pluginInstances.find((p) => p.id === pluginInstanceId);
  if (!inst) return null;
  const device = mockSession.plugins.find((d) => d.id === inst.deviceId);
  return device ? { device, inst } : null;
}

export function InsertSlotView({ slot }: { slot: InsertSlotData }) {
  const resolved = resolveDevice(slot.pluginInstanceId);
  const empty = !resolved;
  return (
    <div
      className={clsx(
        "flex h-[20px] items-center justify-between rounded-[4px] px-1.5 text-[10px]",
        empty
          ? "border border-dashed border-surface-300 bg-white/60 text-surface-400"
          : "panel-lift text-surface-800"
      )}
      style={
        resolved
          ? {
              boxShadow: `inset 0 0 0 1px ${resolved.device.accent}33, 0 1px 0 rgba(255,255,255,0.9) inset`
            }
          : undefined
      }
    >
      {empty ? (
        <span className="flex w-full items-center justify-between">
          <Plus className="h-2.5 w-2.5" />
          <span className="tracking-widest">INS {slot.index + 1}</span>
        </span>
      ) : (
        <>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: resolved.device.accent }}
          />
          <span className="flex-1 truncate px-1.5 font-medium">
            {resolved.device.name.replace("Architexure ", "")}
          </span>
          {slot.bypassed && (
            <span className="text-[9px] uppercase tracking-wider text-surface-400">
              BYP
            </span>
          )}
        </>
      )}
    </div>
  );
}
