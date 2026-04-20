"use client";

import { Bell, Cloud, Command, Cpu, Folder, Waves } from "lucide-react";
import { useInstinct } from "@/lib/store";
import { MenuBar } from "./MenuBar";
import { CommandPalette } from "./CommandPalette";

export function TopBar() {
  const session = useInstinct((s) => s.session);

  return (
    <header
      className="relative z-30 flex h-11 flex-none items-center border-b border-surface-200 bg-white/90 px-3 backdrop-blur"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* traffic-light spacer like macOS apps */}
      <div className="flex h-full items-center gap-1.5 pr-3">
        <span className="h-3 w-3 rounded-full bg-[#ED6A5E] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)]" />
        <span className="h-3 w-3 rounded-full bg-[#F4BF4F] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)]" />
        <span className="h-3 w-3 rounded-full bg-[#61C554] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)]" />
      </div>

      <div className="divider-v h-5" />

      <div className="flex items-center gap-2 pl-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-white to-surface-150 shadow-lift">
          <Waves className="h-3.5 w-3.5 text-surface-800" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight text-surface-900">
            INSTINCT
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-surface-500">
            by Hughes Technologies
          </div>
        </div>
      </div>

      <div className="mx-3 h-5 w-px bg-surface-200" />

      <MenuBar />

      <div className="mx-3 h-5 w-px bg-surface-200" />

      <div className="flex items-center gap-2 text-xs text-surface-600">
        <Folder className="h-3.5 w-3.5 text-surface-500" />
        <span className="font-medium text-surface-800">{session.name}</span>
        <span className="text-surface-400">·</span>
        <span className="num-readout">
          {session.sampleRate / 1000} kHz / {session.bitDepth}-bit
        </span>
      </div>

      <div
        className="ml-auto flex items-center gap-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <CommandKHint />
        <StatusChip icon={<Cpu className="h-3 w-3" />} label="CPU" value="14%" />
        <StatusChip icon={<Waves className="h-3 w-3" />} label="I/O" value="48.0k" />
        <StatusChip icon={<Cloud className="h-3 w-3" />} label="SYNC" value="IDLE" />
        <button className="pill-btn" aria-label="Notifications">
          <Bell className="h-3 w-3" />
        </button>
      </div>

      <CommandPalette />
    </header>
  );
}

function CommandKHint() {
  return (
    <span
      className="flex items-center gap-1 rounded-md border border-surface-200 bg-white/80 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-surface-500 shadow-lift"
      title="Open command palette (⌘K)"
    >
      <Command className="h-3 w-3" />
      K
    </span>
  );
}

function StatusChip({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-surface-200 bg-white/80 px-2 py-1 shadow-lift">
      <span className="text-surface-500">{icon}</span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-surface-500">
        {label}
      </span>
      <span className="num-readout text-[11px] font-medium text-surface-800">
        {value}
      </span>
    </div>
  );
}
