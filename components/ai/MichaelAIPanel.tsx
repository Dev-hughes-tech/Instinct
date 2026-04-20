"use client";

import clsx from "clsx";
import { Sparkles, Wand2, ZapOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useInstinct } from "@/lib/store";
import { streamMichael } from "@/lib/michael-client";
import { CAPABILITIES, type MichaelCapabilityId } from "@/lib/michael-capabilities";
import type { MichaelAIState } from "@/lib/types";

const MODES: MichaelAIState["mode"][] = [
  "Mixing",
  "Arrangement",
  "Mastering",
  "Off"
];

const MODE_TO_CAP: Record<MichaelAIState["mode"], MichaelCapabilityId> = {
  Mixing: "mix-suggestion",
  Arrangement: "sequencing",
  Mastering: "master-plan",
  Off: "chat"
};

export function MichaelAIPanel({ compact = false }: { compact?: boolean }) {
  const session = useInstinct((s) => s.session);
  const ai = session.ai;
  const setMode = useInstinct((s) => s.setAIMode);
  const toggle = useInstinct((s) => s.toggleAI);

  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const capability = useMemo(() => MODE_TO_CAP[ai.mode], [ai.mode]);
  const capMeta = CAPABILITIES.find((c) => c.id === capability)!;

  async function run() {
    if (!ai.enabled) return;
    setStatus("running");
    setOutput("");
    setError(null);
    try {
      await streamMichael({
        capability,
        input: "",
        session,
        onToken: (t) => setOutput((o) => o + t)
      });
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <div
      data-testid="michael-ai-panel"
      className="chassis-holographic relative flex flex-col gap-2 overflow-hidden rounded-xl p-3 text-white"
    >
      <span className="holo-sweep pointer-events-none absolute inset-0" />
      <div className="relative flex items-center gap-2">
        <div className="h-7 w-7 overflow-hidden rounded-full border border-white/25 bg-black/40">
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #ffffff 0%, #8C7BFF 40%, #38D1E0 80%)"
            }}
          />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            Michael AI
          </div>
          <div className="text-[13px] font-semibold">Mixing with Michael</div>
        </div>
        <button
          onClick={toggle}
          className={clsx(
            "ml-auto rounded-full border px-2 py-1 text-[9px] uppercase tracking-[0.2em]",
            ai.enabled
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/10 bg-black/20 text-white/50"
          )}
          aria-label="Toggle Michael AI"
        >
          {ai.enabled ? <Sparkles className="inline h-3 w-3" /> : <ZapOff className="inline h-3 w-3" />}{" "}
          {ai.enabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="relative grid grid-cols-4 gap-1 text-center">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              "rounded-md border px-1 py-1 text-[9px] uppercase tracking-[0.15em]",
              ai.mode === m
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/10 bg-black/20 text-white/60"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={run}
        disabled={!ai.enabled || status === "running"}
        className={clsx(
          "relative flex items-center justify-center gap-1 rounded-md border border-white/20 bg-black/40 py-1.5 text-[11px] font-medium tracking-wide",
          !ai.enabled && "opacity-40",
          status === "running" && "animate-pulse"
        )}
      >
        <Wand2 className="h-3 w-3 text-accent-cyan" />
        {status === "running"
          ? "Michael is thinking…"
          : `Run ${capMeta.shortName} · Claude`}
      </button>

      {!compact && (
        <div className="relative max-h-52 overflow-auto rounded-md border border-white/10 bg-black/30 p-2 text-[11px] leading-snug text-white/90">
          {error ? (
            <span className="text-red-300">{error}</span>
          ) : output ? (
            <pre className="whitespace-pre-wrap font-sans">{output}</pre>
          ) : (
            <span className="text-white/60">
              {ai.lastSuggestion} · Press Run to generate a fresh analysis with Michael (Claude).
            </span>
          )}
        </div>
      )}
    </div>
  );
}
