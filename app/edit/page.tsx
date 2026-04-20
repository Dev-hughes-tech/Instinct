import { TransportBar } from "@/components/transport/TransportBar";
import { TrackPanel } from "@/components/edit/TrackPanel";
import { WaveformArea } from "@/components/edit/WaveformArea";
import { Inspector } from "@/components/edit/Inspector";
import { IntegratedMixer } from "@/components/mixer/IntegratedMixer";
import { PluginRack } from "@/components/edit/PluginRack";

export default function EditPage() {
  return (
    <div data-testid="edit-screen" className="flex h-full flex-col bg-surface-100">
      {/* TOP — floating transport */}
      <div className="relative flex-none px-4 pt-3 pb-2">
        <TransportBar />
      </div>

      {/* MIDDLE — track panel | waveform | inspector */}
      <div className="flex min-h-0 flex-1 gap-1 px-3">
        <TrackPanel />
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-surface-200 bg-white/60 shadow-lift">
          <WaveformArea />
        </div>
        <Inspector />
      </div>

      {/* BOTTOM — plugin rack | integrated mixer (rack sits under track panel width) */}
      <div className="flex flex-none items-stretch gap-1 px-3 pb-3 pt-2" style={{ height: 320 }}>
        <PluginRack />
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-surface-200 bg-white/60 shadow-lift">
          <IntegratedMixer />
        </div>
      </div>
    </div>
  );
}
