"use client";

import clsx from "clsx";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  FileDown,
  FileUp,
  Info
} from "lucide-react";
import {
  INTEROP_FORMATS,
  detectFormat,
  exportFile,
  importFile,
  type InteropFormat,
  type InteropFormatDescriptor,
  type InteropImportResult,
  type InteropSession
} from "@/lib/interop";

const DEFAULT_SESSION: InteropSession = {
  meta: {
    name: "Maserati — Untitled",
    sampleRate: 48000,
    bitDepth: 24,
    tempoBpm: 92,
    timeSignature: [4, 4],
    lengthSeconds: 180,
    source: "instinct"
  },
  tracks: [
    { id: "t1", name: "Kick",   kind: "audio", clips: [{ id: "c1", name: "Kick Loop",   startSec: 0, lengthSec: 8, sourcePath: "Media/kick.wav" }] },
    { id: "t2", name: "Snare",  kind: "audio", clips: [{ id: "c2", name: "Snare Loop",  startSec: 0, lengthSec: 8, sourcePath: "Media/snare.wav" }] },
    { id: "t3", name: "Hats",   kind: "audio", clips: [{ id: "c3", name: "Hats Loop",   startSec: 0, lengthSec: 8, sourcePath: "Media/hats.wav" }] },
    { id: "t4", name: "Bass",   kind: "midi",  clips: [{ id: "c4", name: "Bass Pattern", startSec: 0, lengthSec: 16 }] },
    { id: "t5", name: "Vocal",  kind: "audio", clips: [{ id: "c5", name: "Lead Vox",    startSec: 4, lengthSec: 60, sourcePath: "Media/vox_lead.wav" }] }
  ]
};

export default function InteropPage() {
  const [session, setSession] = useState<InteropSession>(DEFAULT_SESSION);
  const [importResult, setImportResult] = useState<InteropImportResult | null>(null);
  const [exportLog, setExportLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const file = files[0]!;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const fmt = detectFormat(file.name, bytes);
      if (!fmt) throw new Error(`Unknown format for "${file.name}".`);
      const result = await importFile(file.name, bytes);
      setImportResult(result);
      setSession(result.session);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function runExport(fmt: InteropFormat) {
    try {
      const result = await exportFile(fmt, session);
      // Copy into a plain ArrayBuffer so Blob's BlobPart signature is satisfied
      // even under strict DOM typings where Uint8Array<ArrayBufferLike> is narrower.
      const ab = new ArrayBuffer(result.buffer.byteLength);
      new Uint8Array(ab).set(result.buffer);
      const blob = new Blob([ab], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.suggestedFilename;
      a.click();
      URL.revokeObjectURL(url);
      setExportLog((prev) =>
        [
          `${new Date().toLocaleTimeString()} · ${fmt.toUpperCase()} → ${result.suggestedFilename} (${result.buffer.length.toLocaleString()} B)`,
          ...(result.warnings.length ? result.warnings.map((w) => `  · ${w}`) : []),
          ...prev
        ].slice(0, 40)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex h-full" data-testid="interop">
      <aside className="w-[280px] flex-none overflow-auto border-r border-surface-200 bg-white/70 p-4">
        <div className="label-tiny">DAW Interop</div>
        <p className="mt-1 text-[11px] leading-relaxed text-surface-600">
          Open and save INSTINCT sessions in the native formats of the top ten
          DAWs. Every adapter is round-trip-lossless for the data it claims to
          preserve; any fields that would drop are surfaced as warnings.
        </p>

        <div className="label-tiny mt-5 mb-1">Current session</div>
        <div className="rounded-md border border-surface-200 bg-white px-2 py-2 text-[11px] leading-tight">
          <div className="font-medium text-surface-900">{session.meta.name}</div>
          <div className="text-surface-500">
            {session.tracks.length} tracks · {session.meta.tempoBpm} BPM · {session.meta.timeSignature[0]}/{session.meta.timeSignature[1]}
          </div>
          <div className="num-readout mt-0.5 text-[10px] text-surface-400">
            {session.meta.sampleRate / 1000} kHz / {session.meta.bitDepth}-bit · source: {session.meta.source}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-b from-accent-violet to-[#5a4ad9] px-3 py-2 text-[12px] font-medium text-white shadow-pop"
        >
          <FileUp className="h-3.5 w-3.5" /> Import DAW project…
        </button>

        {error && (
          <div className="mt-3 flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
            <AlertTriangle className="mt-px h-3 w-3 flex-none" />
            <span>{error}</span>
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1 overflow-auto p-6">
        <div>
          <div className="label-tiny">DAW Interop</div>
          <h1 className="text-xl font-light tracking-tight text-surface-900">
            Session interchange
          </h1>
          <p className="mt-0.5 text-[12px] text-surface-500">
            Import from nine DAWs. Export to eight. Includes BWF master bouncing for broadcast.
          </p>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {INTEROP_FORMATS.map((f) => (
            <FormatCard key={f.id} f={f} onExport={runExport} />
          ))}
        </section>

        {importResult && <ImportResultPanel result={importResult} />}

        <section className="panel-surface mt-6 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-surface-700" />
            <span className="text-[13px] font-semibold text-surface-900">Export log</span>
          </div>
          <div className="mt-2 max-h-[220px] overflow-auto rounded-md border border-surface-100 bg-surface-50 p-2 font-mono text-[10px] leading-relaxed text-surface-700">
            {exportLog.length === 0 ? (
              <div className="p-2 text-center text-surface-400">
                No exports yet.
              </div>
            ) : (
              exportLog.map((line, i) => (
                <div key={i} className={clsx(line.startsWith("  ·") ? "text-surface-500" : "text-surface-800")}>
                  {line}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FormatCard({
  f,
  onExport
}: {
  f: InteropFormatDescriptor;
  onExport: (fmt: InteropFormat) => void;
}) {
  return (
    <div className="panel-surface flex flex-col gap-2 rounded-xl p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="label-tiny">{f.vendor}</div>
          <div className="text-[13px] font-medium text-surface-900">{f.label}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-surface-500">
            {f.extensions.join("  ·  ")}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Caps label="Import" on={f.canImport} />
          <Caps label="Export" on={f.canExport} />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={() => onExport(f.id)}
          disabled={!f.canExport}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px]",
            f.canExport
              ? "bg-surface-900 text-white hover:bg-black"
              : "cursor-not-allowed bg-surface-100 text-surface-400"
          )}
        >
          <ArrowDownToLine className="h-3 w-3" /> Export
        </button>
        <span
          className={clsx(
            "flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px]",
            f.canImport
              ? "border-surface-200 bg-white text-surface-700"
              : "border-surface-200 bg-surface-50 text-surface-400"
          )}
        >
          <ArrowUpFromLine className="h-3 w-3" /> Import
        </span>
      </div>
    </div>
  );
}

function Caps({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em]",
        on
          ? "border-[#0b8a46]/30 bg-[#0b8a46]/10 text-[#0b8a46]"
          : "border-surface-200 bg-surface-50 text-surface-400"
      )}
    >
      {on ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Info className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

function ImportResultPanel({ result }: { result: InteropImportResult }) {
  return (
    <section className="panel-surface mt-6 rounded-xl p-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[#0b8a46]" />
        <span className="text-[13px] font-semibold text-surface-900">
          Import report
        </span>
        <span className="label-tiny">
          {result.bytesRead.toLocaleString()} B · {result.session.meta.source}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="label-tiny mb-1">Tracks</div>
          <ul className="flex flex-col gap-0.5 text-[11px] text-surface-800">
            {result.session.tracks.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>{t.name}</span>
                <span className="text-surface-400">{t.kind}</span>
              </li>
            ))}
            {result.session.tracks.length === 0 && (
              <li className="text-surface-400">No tracks parsed.</li>
            )}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          {result.warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
              <div className="font-medium">Warnings</div>
              <ul className="mt-1 list-disc pl-4">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {result.unsupported.length > 0 && (
            <div className="rounded-md border border-surface-200 bg-white p-2 text-[11px] text-surface-700">
              <div className="font-medium">Fields not yet mapped</div>
              <ul className="mt-1 list-disc pl-4 text-surface-500">
                {result.unsupported.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
