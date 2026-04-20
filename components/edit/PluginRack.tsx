"use client";

import { useState } from "react";
import { useInstinct } from "@/lib/store";
import { PluginDeviceView } from "@/components/plugins/PluginDeviceView";
import { ArchitexureBrowser } from "@/components/plugins/ArchitexureBrowser";
import { ARCHITEXURE_PLUGINS } from "@/lib/architexurePlugins";

/**
 * Lower-left plugin rack. Shows the signal chain for the selected track
 * with Architexure + Michael AI devices stacked vertically. The "+ Add
 * Device" slot opens the full 30-plugin Architexure browser.
 */
export function PluginRack() {
  const session = useInstinct((s) => s.session);
  const { inspector, pluginInstances, plugins, tracks } = session;
  const selected = tracks.find((t) => t.id === inspector.selectedTrackId) ?? tracks[6]!;
  const instances = pluginInstances.filter((p) => p.trackId === selected.id);

  const [browserOpen, setBrowserOpen] = useState(false);
  const [pendingPlugins, setPendingPlugins] = useState<string[]>([]);

  const displayInstances =
    instances.length > 0
      ? instances
      : ["plg-mai7", "plg-vca3a", "plg-bc2"].map((deviceId) => ({
          id: `demo-${deviceId}`,
          deviceId,
          trackId: selected.id,
          parameters: {}
        }));

  // Also append "pending" plugins picked from the Architexure browser so the
  // user sees immediate feedback before the Session reducer is wired in.
  const pendingInstances = pendingPlugins.map((pid, i) => ({
    id: `pending-${selected.id}-${pid}-${i}`,
    deviceId: pid,
    trackId: selected.id,
    parameters: {}
  }));

  return (
    <div
      data-testid="plugin-rack"
      className="relative flex h-full w-[288px] flex-none flex-col gap-2 overflow-auto border-t border-surface-200 bg-surface-100 p-2"
    >
      <div className="flex items-center justify-between px-1">
        <span className="label-tiny">Rack · {selected.name}</span>
        <span className="label-tiny">Architexure · {ARCHITEXURE_PLUGINS.length} devices</span>
      </div>
      <div className="flex flex-col gap-2">
        {[...displayInstances, ...pendingInstances].map((inst) => {
          // Try main plugin registry first, then fall back to Architexure catalog.
          const device = plugins.find((d) => d.id === inst.deviceId);
          if (device) {
            return <PluginDeviceView key={inst.id} device={device} instance={inst} />;
          }
          const arx = ARCHITEXURE_PLUGINS.find((p) => p.id === inst.deviceId);
          if (!arx) return null;
          // Build a PluginDevice-shaped adapter for the generic view.
          const chassis =
            arx.chassis === "graphite" || arx.chassis === "ivory" ? "silver" : arx.chassis;
          return (
            <PluginDeviceView
              key={inst.id}
              device={{
                id: arx.id,
                name: arx.name,
                vendor: "Hughes Technologies",
                category:
                  arx.category === "dynamics" ? "compressor" :
                  arx.category === "eq" ? "eq" :
                  arx.category === "reverb" ? "reverb" :
                  arx.category === "delay" ? "delay" :
                  arx.category === "saturation" ? "saturation" :
                  arx.category === "ai" ? "ai" :
                  "utility",
                family: arx.family,
                chassis,
                accent: arx.accent,
                version: arx.version
              }}
              instance={inst}
            />
          );
        })}
      </div>
      <button
        onClick={() => setBrowserOpen((o) => !o)}
        className="panel-sunken mt-1 flex h-8 items-center justify-center rounded-md text-[10px] uppercase tracking-[0.2em] text-surface-500 hover:text-surface-900"
      >
        + Add Architexure Device
      </button>

      {browserOpen && (
        <div className="absolute bottom-10 left-2 z-40 shadow-2xl">
          <ArchitexureBrowser
            onPick={(id) => {
              setPendingPlugins((p) => [...p, id]);
              setBrowserOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
