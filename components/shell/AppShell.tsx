"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { PluginWindowHost } from "@/components/audio/PluginWindow";
import { useAudioStore } from "@/lib/audio/audioStore";

export function AppShell({ children }: { children: ReactNode }) {
  const start = useAudioStore((s) => s.start);
  const ready = useAudioStore((s) => s.ready);

  useEffect(() => {
    // Boot the audio engine on the first user interaction anywhere in the app.
    // Browsers require a user gesture before an AudioContext may resume, so we
    // wait for the first pointer / key / touch event rather than booting on mount.
    if (ready) return;
    const fire = () => {
      void start();
      window.removeEventListener("pointerdown", fire);
      window.removeEventListener("keydown", fire);
    };
    window.addEventListener("pointerdown", fire, { once: true });
    window.addEventListener("keydown", fire, { once: true });
    return () => {
      window.removeEventListener("pointerdown", fire);
      window.removeEventListener("keydown", fire);
    };
  }, [ready, start]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-100">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <PluginWindowHost />
    </div>
  );
}
