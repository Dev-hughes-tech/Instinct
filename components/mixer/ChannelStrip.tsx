"use client";

import clsx from "clsx";
import type { MixerStrip } from "@/lib/types";
import { Knob } from "@/components/controls/Knob";
import { Fader } from "@/components/controls/Fader";
import { StatusPill } from "@/components/controls/StatusPill";
import { MeterLadder } from "@/components/controls/MeterDot";
import { InsertSlotView } from "@/components/controls/InsertSlot";
import { AuxSendView } from "@/components/controls/AuxSend";
import { trackColor } from "@/lib/theme";
import { formatDb, formatPan } from "@/lib/format";

interface ChannelStripProps {
  strip: MixerStrip;
  variant?: "integrated" | "standalone";
  onFaderChange?: (v: number) => void;
  onMute?: () => void;
  onSolo?: () => void;
}

export function ChannelStrip({
  strip,
  variant = "integrated",
  onMute,
  onSolo
}: ChannelStripProps) {
  const isStandalone = variant === "standalone";
  const color = trackColor(strip.colorKey as never);
  return (
    <div
      data-testid={`strip-${strip.trackId}`}
      className={clsx(
        "strip-face relative flex flex-col items-stretch rounded-xl px-1.5 py-2",
        isStandalone ? "w-[74px] gap-2" : "w-[86px] gap-1.5"
      )}
    >
      {/* header bar */}
      <div
        className="mx-auto w-full overflow-hidden rounded-md px-1.5 py-1 text-center text-[10px] font-medium uppercase tracking-[0.1em]"
        style={{
          background: `linear-gradient(180deg, ${color}dd, ${color}99)`,
          color: "#1a1a1a",
          border: `1px solid ${color}55`,
          boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset"
        }}
        title={strip.label}
      >
        <span className="truncate">{strip.label}</span>
      </div>

      {/* Preamp / IO */}
      <div className="panel-sunken flex flex-col items-center gap-1 rounded-md py-1">
        <span className="label-tiny">IN</span>
        <span className="num-readout text-[9px] text-surface-700">{strip.inputLabel}</span>
      </div>

      {/* Inserts */}
      <div data-testid="inserts-panel" className="flex flex-col gap-1">
        <div className="label-tiny text-center">Inserts</div>
        {strip.inserts.slice(0, 5).map((slot) => (
          <InsertSlotView key={slot.id} slot={slot} />
        ))}
      </div>

      {/* EQ knobs (standalone only) */}
      {isStandalone && (
        <div className="flex flex-col items-center gap-1 py-1">
          <div className="label-tiny">EQ</div>
          <div className="grid grid-cols-2 place-items-center gap-1">
            <Knob size="xs" value={0.55} label="HF" bipolar />
            <Knob size="xs" value={0.5} label="HM" bipolar />
            <Knob size="xs" value={0.5} label="LM" bipolar />
            <Knob size="xs" value={0.6} label="LF" bipolar />
          </div>
        </div>
      )}

      {/* Dynamics strip-level */}
      {isStandalone && (
        <div className="flex flex-col items-center gap-1">
          <div className="label-tiny">DYN</div>
          <div className="flex gap-1">
            <Knob size="xs" value={0.55} label="THR" />
            <Knob size="xs" value={0.5} label="RAT" />
          </div>
        </div>
      )}

      {/* Sends */}
      <div className="flex flex-col gap-1">
        <div className="label-tiny text-center">Sends</div>
        {strip.sends.map((s) => (
          <AuxSendView key={s.id} send={s} />
        ))}
      </div>

      {/* Pan */}
      <div className="flex items-center justify-center">
        <Knob
          size="sm"
          value={(strip.pan + 1) / 2}
          label="PAN"
          sublabel={formatPan(strip.pan)}
          bipolar
          accent={color}
        />
      </div>

      {/* Mute / Solo / Rec */}
      <div className="grid grid-cols-3 gap-1">
        <StatusPill tone="mute" active={strip.mute} onClick={onMute}>
          M
        </StatusPill>
        <StatusPill tone="solo" active={strip.solo} onClick={onSolo}>
          S
        </StatusPill>
        <StatusPill tone="record" active={strip.record}>
          R
        </StatusPill>
      </div>

      {/* Fader + meter */}
      <div className="flex items-end justify-center gap-1 pt-1">
        <Fader
          value={strip.fader}
          accent={color}
          readout={formatDb(strip.fader)}
          height={isStandalone ? 170 : 140}
        />
        <div className="flex flex-col items-center gap-1 pb-4">
          <MeterLadder level={strip.meter.peak} dots={isStandalone ? 14 : 10} />
          <MeterLadder level={strip.meter.rms} dots={isStandalone ? 14 : 10} />
        </div>
      </div>

      {/* Output */}
      <div className="panel-sunken mt-1 flex items-center justify-center rounded-md py-1">
        <span className="num-readout text-[9px] text-surface-700">{strip.outputLabel}</span>
      </div>
    </div>
  );
}
