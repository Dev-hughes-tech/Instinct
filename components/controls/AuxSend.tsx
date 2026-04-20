"use client";

import clsx from "clsx";
import type { AuxSend } from "@/lib/types";
import { MeterDot } from "./MeterDot";

export function AuxSendView({ send }: { send: AuxSend }) {
  return (
    <div
      className={clsx(
        "flex h-[18px] items-center justify-between rounded-[4px] px-1.5 text-[10px]",
        send.enabled ? "panel-lift text-surface-800" : "bg-white/60 text-surface-400"
      )}
    >
      <span className="label-tiny">{send.label}</span>
      <div className="num-readout tabular-nums text-[10px] text-surface-700">
        {send.preFader ? "PRE" : "PST"}
      </div>
      <MeterDot level={send.enabled ? send.level : 0} size={6} />
    </div>
  );
}
