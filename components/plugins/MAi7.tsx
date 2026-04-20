"use client";

import { Sparkles } from "lucide-react";
import { Knob } from "@/components/controls/Knob";
import type { PluginDevice, PluginInstance } from "@/lib/types";

export function MAi7({
  device,
  instance
}: {
  device: PluginDevice;
  instance: PluginInstance;
}) {
  const p = instance.parameters;
  return (
    <div className="chassis-holographic relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-white">
      <span className="holo-sweep pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/60">
          Michael AI
        </span>
        <span className="flex items-center gap-1 text-[13px] font-semibold tracking-tight">
          M<span className="opacity-60">|</span>Ai-7
          <Sparkles className="h-3 w-3 text-accent-cyan" />
        </span>
        <span className="text-[8px] uppercase tracking-[0.15em] text-white/60">
          Intelligent Assistant
        </span>
      </div>
      <div className="relative flex flex-1 items-center justify-evenly">
        <Knob size="sm" tone="dark" accent="#38D1E0" value={p.macro ?? 0.62} label="MACRO" />
        <Knob size="sm" tone="dark" accent="#8C7BFF" value={p.intensity ?? 0.5} label="INTENSITY" />
        <Knob size="xs" tone="dark" accent="#5BD4A4" value={p.target ?? 0.7} label="TARGET" />
      </div>
      <div className="relative flex h-full flex-col items-center justify-center">
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/25 bg-black/40">
          <div className="holo-sweep absolute inset-0" />
          {/* Stylized Michael AI face: gradient orb + smile */}
          <div
            className="absolute inset-1 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #ffffff 0%, #8C7BFF 40%, #38D1E0 80%)"
            }}
          />
          <div className="absolute left-[8px] top-[10px] h-1 w-1 rounded-full bg-black/70" />
          <div className="absolute right-[8px] top-[10px] h-1 w-1 rounded-full bg-black/70" />
          <div className="absolute bottom-[8px] left-1/2 h-[3px] w-3 -translate-x-1/2 rounded-b-full border-b border-black/70" />
        </div>
        <span className="mt-1 text-[8px] uppercase tracking-[0.18em] text-white/70">
          LISTENING
        </span>
      </div>
    </div>
  );
}
