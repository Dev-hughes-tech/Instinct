import Link from "next/link";
import {
  AudioWaveform,
  Sliders,
  Sparkles,
  CircleDot,
  Clock,
  Library,
  Piano,
  TrendingUp
} from "lucide-react";
import { mockSession } from "@/lib/mockData";
import { COLLECTIONS } from "@/lib/library";
import { MIDI_DEVICES } from "@/lib/midi";

export default function DashboardPage() {
  const s = mockSession;
  return (
    <div className="h-full overflow-auto px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <div className="label-tiny">SESSION</div>
            <h1 className="mt-1 text-4xl font-light tracking-tight text-surface-900">
              {s.name}
            </h1>
            <p className="mt-2 text-sm text-surface-600">
              INSTINCT · Hughes Technologies · Architexure ecosystem engaged
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/library"
              className="panel-lift flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-800"
            >
              <Library className="h-4 w-4" /> Library
            </Link>
            <Link
              href="/midi"
              className="panel-lift flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-800"
            >
              <Piano className="h-4 w-4" /> MIDI Studio
            </Link>
            <Link
              href="/edit"
              className="panel-lift flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-surface-800"
            >
              <AudioWaveform className="h-4 w-4" /> Open Edit
            </Link>
            <Link
              href="/mixer"
              className="flex items-center gap-2 rounded-lg bg-surface-900 px-4 py-2 text-sm font-medium text-white shadow-pop"
            >
              <Sliders className="h-4 w-4" /> Open Mixer
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-3" title="Tempo" icon={<Clock className="h-4 w-4" />}>
            <div className="num-readout text-4xl font-light text-surface-900">
              {s.transport.tempoBpm}
              <span className="ml-1 text-sm text-surface-500">BPM</span>
            </div>
            <div className="mt-1 text-xs text-surface-500">
              {s.transport.timeSig[0]}/{s.transport.timeSig[1]} ·{" "}
              {s.transport.loop ? "Loop on" : "Loop off"}
            </div>
          </Card>

          <Card className="col-span-3" title="Tracks" icon={<CircleDot className="h-4 w-4" />}>
            <div className="num-readout text-4xl font-light text-surface-900">
              {s.tracks.length}
            </div>
            <div className="mt-1 text-xs text-surface-500">
              {s.pluginInstances.length} plugin instances · {s.auxBuses.length} aux buses
            </div>
          </Card>

          <Card className="col-span-3" title="MIDI Devices" icon={<Piano className="h-4 w-4" />}>
            <div className="num-readout text-4xl font-light text-surface-900">
              {MIDI_DEVICES.filter((d) => d.connected).length}
              <span className="ml-2 text-sm text-surface-500">
                / {MIDI_DEVICES.length}
              </span>
            </div>
            <div className="mt-1 text-xs text-surface-500">
              Universal compatibility · USB · BLE · DIN · RTP
            </div>
          </Card>

          <Card
            className="col-span-3"
            title="Michael AI"
            icon={<Sparkles className="h-4 w-4 text-accent-violet" />}
          >
            <div className="text-sm text-surface-800">
              Confidence:{" "}
              <span className="num-readout text-lg font-medium">
                {Math.round(s.ai.confidence * 100)}%
              </span>
            </div>
            <div className="mt-1 text-xs text-surface-500">{s.ai.lastSuggestion}</div>
          </Card>

          <Card
            className="col-span-8"
            title="Sound & Sample Library"
            icon={<Library className="h-4 w-4" />}
          >
            <ul className="grid grid-cols-2 gap-2">
              {COLLECTIONS.slice(0, 4).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-surface-200 bg-white p-2.5"
                >
                  <span
                    className="h-10 w-10 flex-none rounded-md border border-surface-200"
                    style={{ background: c.cover }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-surface-900">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-surface-500">
                      {c.vendor} · {c.sampleCount} items
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/library"
              className="mt-3 inline-block text-[12px] font-medium text-accent-blue"
            >
              Browse all libraries →
            </Link>
          </Card>

          <Card className="col-span-4" title="Architexure rack" icon={<TrendingUp className="h-4 w-4" />}>
            <ul className="space-y-1.5 text-sm">
              {s.plugins.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="text-surface-800">{p.name}</span>
                  <span className="text-xs text-surface-400">{p.version}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
  className
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`panel-surface relative overflow-hidden rounded-2xl p-5 ${className ?? ""}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-surface-500">{icon}</span>
        <h2 className="label-tiny">{title}</h2>
      </div>
      {children}
    </section>
  );
}
