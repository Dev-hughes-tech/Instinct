"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { Loader2, Send, Sparkles, Wand2 } from "lucide-react";
import { useInstinct } from "@/lib/store";
import { streamMichael } from "@/lib/michael-client";
import {
  CAPABILITIES,
  type MichaelCapabilityId
} from "@/lib/michael-capabilities";

export default function MichaelPage() {
  const session = useInstinct((s) => s.session);
  const [capability, setCapability] = useState<MichaelCapabilityId>("mix-suggestion");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (status === "running") {
      abortRef.current?.abort();
      setStatus("idle");
      return;
    }
    setStatus("running");
    setOutput("");
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await streamMichael({
        capability,
        input,
        session,
        signal: ctrl.signal,
        onToken: (t) => setOutput((o) => o + t)
      });
      setStatus("idle");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setStatus("idle");
        return;
      }
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <div data-testid="michael-page" className="flex h-full">
      <aside className="w-[260px] flex-none border-r border-surface-200 bg-white/70 p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full border border-surface-200">
            <div
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, #ffffff 0%, #8C7BFF 40%, #38D1E0 80%)"
              }}
            />
          </div>
          <div className="leading-tight">
            <div className="label-tiny">Mixing with</div>
            <div className="text-[14px] font-semibold text-surface-900">Michael AI</div>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-surface-500">
          Michael analyzes your session and returns concrete production moves.
          Powered by Claude (Anthropic) under Michael AI persona.
        </p>

        <div className="label-tiny mb-1 mt-4">Capability</div>
        <ul className="flex flex-col gap-1">
          {CAPABILITIES.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setCapability(c.id)}
                className={clsx(
                  "flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left",
                  capability === c.id
                    ? "bg-white shadow-lift"
                    : "hover:bg-white"
                )}
              >
                <span className="text-[12px] font-medium text-surface-900">
                  {c.name}
                </span>
                <span className="text-[10px] text-surface-500">
                  {c.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-surface-200 bg-white/70 px-5 py-3">
          <Sparkles className="h-4 w-4 text-accent-violet" />
          <h1 className="text-lg font-light tracking-tight text-surface-900">
            {CAPABILITIES.find((c) => c.id === capability)!.name}
          </h1>
          <span className="ml-auto text-[11px] text-surface-500">
            Session: {session.name} · {session.transport.tempoBpm} BPM · {session.tracks.length} tracks
          </span>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden p-5">
          <div className="panel-surface mb-3 flex items-end gap-2 rounded-xl p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Brief Michael — e.g. 'make the lead vocal sit forward without clipping; aim for streaming LUFS'"
              className="min-h-[64px] flex-1 resize-none rounded-md border border-surface-200 bg-white/80 p-2 text-[13px] outline-none focus:border-accent-blue"
            />
            <button
              onClick={run}
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium text-white shadow-pop",
                status === "running"
                  ? "bg-gradient-to-b from-red-500 to-red-700"
                  : "bg-gradient-to-b from-accent-violet to-[#5a4ad9]"
              )}
            >
              {status === "running" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Stop
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" /> Ask Michael
                </>
              )}
            </button>
          </div>

          <section className="panel-sunken flex flex-1 flex-col overflow-hidden rounded-xl">
            <div className="flex items-center gap-2 border-b border-surface-200 bg-white/60 px-3 py-2">
              <Send className="h-3.5 w-3.5 text-surface-500" />
              <span className="label-tiny">Michael's response</span>
              {error && <span className="ml-auto text-[11px] text-red-600">{error}</span>}
            </div>
            <div className="flex-1 overflow-auto p-4">
              {output ? (
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-surface-800">
                  {output}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-[12px] text-surface-500">
                  {status === "running"
                    ? "Michael is thinking…"
                    : "Brief Michael above and press Ask."}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
