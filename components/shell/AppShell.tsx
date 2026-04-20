"use client";

import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-100">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
