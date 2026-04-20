"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CircleDot, Radio } from "lucide-react";
import {
  enableWebMidi,
  isWebMidiSupported,
  listPorts,
  onMidiMessage,
  onStateChange,
  type DetectedMidiPort,
  type DecodedMidiMessage,
  type WebMidiStatus
} from "@/lib/webmidi";

/**
 * Live WebMIDI panel — surfaces real, connected MIDI inputs/outputs and a
 * rolling 32-message log. Runs only in the browser; SSR-safe thanks to the
 * "use client" directive and capability probe inside useEffect.
 */
export function LiveWebMidi() {
  const [status, setStatus] = useState<WebMidiStatus>({ supported: false, granted: false });
  const [ports, setPorts] = useState<DetectedMidiPort[]>([]);
  const [log, setLog] = useState<DecodedMidiMessage[]>([]);

  useEffect(() => {
    const unbindState = onStateChange((next) => setPorts(next));
    const unbindMsg = onMidiMessage((m) => {
      setLog((prev) => [m, ...prev].slice(0, 32));
    });
    return () => {
      unbindState();
      unbindMsg();
    };
  }, []);

  async function enable() {
    const s = await enableWebMidi();
    setStatus(s);
    if (s.granted) setPorts(listPorts());
  }

  useEffect(() => {
    setStatus({ supported: isWebMidiSupported(), granted: false });
  }, []);

  return (
    <section className="panel-surface rounded-xl p-4">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-surface-700" />
        <span className="text-[13px] font-semibold text-surface-900">Live WebMIDI</span>
        <StatusBadge status={status} />
        <button
          onClick={enable}
          disabled={!status.supported || status.granted}
          className={clsx(
            "ml-auto rounded-md px-2.5 py-1 text-[11px] font-medium",
            status.granted
              ? "bg-surface-100 text-surface-500"
              : "bg-gradient-to-b from-accent-violet to-[#5a4ad9] text-white shadow-pop"
          )}
        >
          {status.granted ? "Detecting…" : "Enable WebMIDI"}
        </button>
      </div>

      {status.error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
          {status.error}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="label-tiny mb-1">Detected Ports</div>
          {ports.length === 0 ? (
            <div className="rounded-md border border-surface-100 bg-surface-50 p-3 text-[11px] text-surface-500">
              {status.granted
                ? "No MIDI devices detected. Plug a device in."
                : "Enable WebMIDI to see your live devices."}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {ports.map((p) => (
                <li
                  key={p.id + p.type}
                  className="flex items-center gap-2 rounded-md border border-surface-100 bg-white px-2 py-1.5 text-[11px]"
                >
                  <CircleDot
                    className={clsx(
                      "h-3 w-3",
                      p.state === "connected" ? "text-[#0b8a46]" : "text-surface-300"
                    )}
                  />
                  <span className="flex-1 truncate text-surface-900">{p.name}</span>
                  <span className="label-tiny">{p.type}</span>
                  {p.hardwareProfile && (
                    <span className="rounded-full border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[9px] text-surface-600">
                      {p.hardwareProfile.category}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="label-tiny mb-1">Message Log (latest 32)</div>
          <div className="max-h-[220px] overflow-auto rounded-md border border-surface-100 bg-surface-50 p-2 font-mono text-[10px] leading-tight text-surface-700">
            {log.length === 0 ? (
              <div className="p-2 text-center text-surface-400">No MIDI in yet.</div>
            ) : (
              log.map((m, i) => (
                <div key={i} className="flex justify-between gap-2 border-b border-surface-100 py-0.5 last:border-b-0">
                  <span className="truncate">
                    {m.type} · ch {m.channel} · {m.data1}
                    {m.data2 !== 0 ? `/${m.data2}` : ""}
                  </span>
                  <span className="num-readout text-surface-400">{m.timestamp.toFixed(0)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: WebMidiStatus }) {
  if (!status.supported) {
    return (
      <span className="flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[10px] text-surface-500">
        <AlertCircle className="h-3 w-3" /> Unsupported
      </span>
    );
  }
  if (status.granted) {
    return (
      <span className="flex items-center gap-1 rounded-full border border-[#0b8a46]/30 bg-[#0b8a46]/10 px-2 py-0.5 text-[10px] text-[#0b8a46]">
        <CheckCircle2 className="h-3 w-3" /> Granted
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[10px] text-surface-600">
      <CircleDot className="h-3 w-3" /> Idle
    </span>
  );
}
