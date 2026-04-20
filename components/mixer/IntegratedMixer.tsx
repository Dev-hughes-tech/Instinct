"use client";

import { useInstinct } from "@/lib/store";
import { ChannelStrip } from "./ChannelStrip";
import { trackColor } from "@/lib/theme";
import { Knob } from "@/components/controls/Knob";
import { Fader } from "@/components/controls/Fader";
import { MeterLadder } from "@/components/controls/MeterDot";

/**
 * Integrated mixer for the bottom of the Edit Screen.
 * Full-width, no dead space at far end, includes aux sends and master.
 */
export function IntegratedMixer() {
  const session = useInstinct((s) => s.session);
  const toggleMute = useInstinct((s) => s.toggleStripMute);
  const toggleSolo = useInstinct((s) => s.toggleStripSolo);

  return (
    <div data-testid="integrated-mixer" className="flex h-full items-stretch gap-1.5 bg-surface-100 p-2">
      <div className="label-tiny flex w-6 flex-none items-start justify-center rotate-180 [writing-mode:vertical-rl] pt-2">
        Mixer
      </div>
      <div className="flex flex-1 items-stretch gap-1.5 overflow-x-auto pb-1">
        {session.strips.map((s) => (
          <ChannelStrip
            key={s.id}
            strip={s}
            variant="integrated"
            onMute={() => toggleMute(s.id)}
            onSolo={() => toggleSolo(s.id)}
          />
        ))}
        {/* Aux buses compact */}
        {session.auxBuses.map((bus) => (
          <CompactAuxStrip key={bus.id} bus={bus} />
        ))}
        {/* Master compact */}
        <CompactMaster />
      </div>
    </div>
  );
}

type InstinctStateShape = ReturnType<typeof useInstinct.getState>;
type AuxBusShape = InstinctStateShape["session"]["auxBuses"][number];

function CompactAuxStrip({ bus }: { bus: AuxBusShape }) {
  return (
    <div className="strip-face flex w-[72px] flex-none flex-col gap-1.5 rounded-xl px-1.5 py-2">
      <div
        className="rounded-md px-1.5 py-1 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-surface-900"
        style={{
          background: `linear-gradient(180deg, ${trackColor("aux")}, ${trackColor("aux")}aa)`
        }}
      >
        <span className="truncate">{bus.name}</span>
      </div>
      <div className="label-tiny text-center">AUX</div>
      <div className="flex items-end justify-center gap-1">
        <Fader value={bus.strip.fader} readout="" height={110} accent="#6E757D" />
        <MeterLadder level={bus.strip.meter.peak} dots={8} />
      </div>
    </div>
  );
}

function CompactMaster() {
  const master = useInstinct((s) => s.session.masterBus);
  return (
    <div className="strip-face ml-auto flex w-[92px] flex-none flex-col gap-1 rounded-xl bg-gradient-to-b from-white to-surface-200 px-1.5 py-2">
      <div className="rounded-md bg-surface-900 px-1.5 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
        MASTER
      </div>
      <Knob size="sm" value={master.strip.fader} label="MON" />
      <div className="flex flex-1 items-end justify-center gap-1">
        <Fader
          value={master.strip.fader}
          accent="#2B2F34"
          readout=""
          height={140}
        />
        <MeterLadder level={master.strip.meter.peak} dots={12} />
        <MeterLadder level={master.strip.meter.rms} dots={12} />
      </div>
    </div>
  );
}
