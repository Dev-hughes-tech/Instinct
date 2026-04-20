"use client";

import { useInstinct } from "@/lib/store";
import { UtilitySidebar } from "@/components/mixer/UtilitySidebar";
import { ChannelStrip } from "@/components/mixer/ChannelStrip";
import { MasterSection } from "@/components/mixer/MasterSection";
import { MeterBridge } from "@/components/mixer/MeterBridge";
import { TransportBar } from "@/components/transport/TransportBar";

export default function MixerPage() {
  const session = useInstinct((s) => s.session);
  const toggleMute = useInstinct((s) => s.toggleStripMute);
  const toggleSolo = useInstinct((s) => s.toggleStripSolo);

  const auxStrips = session.auxBuses.map((b) => b.strip);
  const allCenterStrips = [...session.strips, ...auxStrips];

  return (
    <div
      data-testid="mixer-screen"
      className="flex h-full flex-col bg-surface-100"
    >
      {/* Top nav / transport / status */}
      <div className="flex-none px-3 pt-2">
        <TransportBar />
      </div>
      <div className="px-3 pt-2">
        <MeterBridge strips={session.strips} master={session.masterBus.strip} />
      </div>

      {/* Main console */}
      <div className="flex min-h-0 flex-1 gap-2 px-3 pb-3 pt-2">
        <UtilitySidebar />

        <div className="min-w-0 flex-1 overflow-auto rounded-xl border border-surface-200 bg-white/70 p-2 shadow-lift">
          <div className="flex items-stretch gap-1.5 pb-1">
            {allCenterStrips.map((s) => (
              <ChannelStrip
                key={s.id}
                strip={s}
                variant="standalone"
                onMute={() => toggleMute(s.id)}
                onSolo={() => toggleSolo(s.id)}
              />
            ))}
          </div>
        </div>

        <MasterSection master={session.masterBus} />
      </div>
    </div>
  );
}
