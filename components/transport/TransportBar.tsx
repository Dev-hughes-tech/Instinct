"use client";

import clsx from "clsx";
import { useEffect } from "react";
import {
  Circle,
  Clock,
  Magnet,
  Play,
  Redo2,
  Repeat,
  Rewind,
  SkipBack,
  SkipForward,
  Square,
  Undo2
} from "lucide-react";
import { useInstinct } from "@/lib/store";
import { useAudioStore } from "@/lib/audio/audioStore";
import { formatBeats } from "@/lib/format";
import { MeterDot } from "@/components/controls/MeterDot";

export function TransportBar() {
  const transport = useInstinct((s) => s.session.transport);
  const inspector = useInstinct((s) => s.session.inspector);
  const togglePlayUi = useInstinct((s) => s.togglePlay);
  const toggleRecord = useInstinct((s) => s.toggleRecord);
  const toggleLoop = useInstinct((s) => s.toggleLoop);
  const toggleMetronomeUi = useInstinct((s) => s.toggleMetronome);
  const toggleSnap = useInstinct((s) => s.toggleSnap);

  const enginePlay = useAudioStore((s) => s.play);
  const engineStop = useAudioStore((s) => s.stop);
  const setTempo = useAudioStore((s) => s.setTempo);
  const setMetronome = useAudioStore((s) => s.setMetronome);
  const masterPeak = useAudioStore((s) => s.masterLevel.peak);

  // Keep the engine tempo mirrored to the UI transport.
  useEffect(() => { setTempo(transport.tempoBpm); }, [transport.tempoBpm, setTempo]);

  const togglePlay = () => {
    togglePlayUi();
    if (transport.playing) void engineStop();
    else void enginePlay();
  };

  const toggleMetronome = () => {
    toggleMetronomeUi();
    setMetronome(!transport.metronome);
  };

  return (
    <div className="panel-surface mx-auto flex h-[56px] w-[760px] max-w-full items-center gap-3 rounded-2xl px-4">
      <div className="flex items-center gap-1">
        <TransportBtn icon={<Undo2 className="h-3.5 w-3.5" />} label="Undo" />
        <TransportBtn icon={<Redo2 className="h-3.5 w-3.5" />} label="Redo" />
      </div>

      <div className="divider-v h-6" />

      <div className="flex items-center gap-1">
        <TransportBtn icon={<SkipBack className="h-3.5 w-3.5" />} label="Home" />
        <TransportBtn icon={<Rewind className="h-3.5 w-3.5" />} label="Back" />
        <TransportBtn
          icon={<Square className="h-3.5 w-3.5 fill-current" />}
          label="Stop"
          onClick={() => {
            if (transport.playing) togglePlay();
            else void engineStop();
          }}
        />
        <TransportBtn
          active={transport.playing}
          onClick={togglePlay}
          tone="accent"
          icon={<Play className="h-3.5 w-3.5 fill-current" />}
          label="Play"
          big
        />
        <TransportBtn
          active={transport.recording}
          onClick={toggleRecord}
          tone="record"
          icon={<Circle className="h-3.5 w-3.5 fill-current" />}
          label="Record"
        />
        <TransportBtn icon={<SkipForward className="h-3.5 w-3.5" />} label="End" />
      </div>

      <div className="divider-v h-6" />

      <div className="panel-sunken flex items-center gap-3 rounded-lg px-3 py-1.5">
        <div className="leading-none">
          <div className="label-tiny">POS</div>
          <div className="num-readout text-[14px] font-medium tracking-tight text-surface-900">
            {formatBeats(transport.positionBeats, transport.timeSig)}
          </div>
        </div>
        <div className="divider-v h-5" />
        <div className="leading-none">
          <div className="label-tiny">BPM</div>
          <div className="num-readout text-[14px] font-medium text-surface-900">
            {transport.tempoBpm.toFixed(2)}
          </div>
        </div>
        <div className="divider-v h-5" />
        <div className="leading-none">
          <div className="label-tiny">SIG</div>
          <div className="num-readout text-[14px] font-medium text-surface-900">
            {transport.timeSig[0]}/{transport.timeSig[1]}
          </div>
        </div>
      </div>

      <div className="divider-v h-6" />

      <div className="flex items-center gap-1">
        <TransportBtn
          active={transport.loop}
          onClick={toggleLoop}
          icon={<Repeat className="h-3.5 w-3.5" />}
          label="Loop"
        />
        <TransportBtn
          active={transport.metronome}
          onClick={toggleMetronome}
          tone="accent"
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Click"
        />
        <TransportBtn
          active={inspector.snap}
          onClick={toggleSnap}
          icon={<Magnet className="h-3.5 w-3.5" />}
          label="Snap"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <MeterDot level={transport.playing ? Math.max(0.15, masterPeak) : 0.1} size={7} />
        <span className="label-tiny">{transport.playing ? "ROLLING" : "STOPPED"}</span>
      </div>
    </div>
  );
}

function TransportBtn({
  icon,
  label,
  onClick,
  active,
  tone = "neutral",
  big = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  tone?: "neutral" | "accent" | "record";
  big?: boolean;
}) {
  const activeColor =
    tone === "record"
      ? "bg-gradient-to-b from-red-500 to-red-700 text-white"
      : tone === "accent"
        ? "bg-gradient-to-b from-surface-900 to-black text-white"
        : "bg-gradient-to-b from-surface-800 to-surface-900 text-white";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center rounded-md border transition",
        big ? "h-8 w-10" : "h-7 w-8",
        active
          ? `${activeColor} border-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)]`
          : "panel-lift text-surface-700 hover:text-surface-900 border-surface-200"
      )}
    >
      {icon}
    </button>
  );
}
