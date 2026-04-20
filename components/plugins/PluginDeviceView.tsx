"use client";

import type { PluginDevice, PluginInstance } from "@/lib/types";
import { VCA3A } from "./VCA3A";
import { BC2 } from "./BC2";
import { MAi7 } from "./MAi7";
import { GenericDevice } from "./GenericDevice";

export function PluginDeviceView({
  device,
  instance
}: {
  device: PluginDevice;
  instance: PluginInstance;
}) {
  if (device.id === "plg-mai7") return <MAi7 device={device} instance={instance} />;
  if (device.id === "plg-vca3a") return <VCA3A device={device} instance={instance} />;
  if (device.id === "plg-bc2") return <BC2 device={device} instance={instance} />;
  return <GenericDevice device={device} instance={instance} />;
}
