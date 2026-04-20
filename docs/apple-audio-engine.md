# Apple Audio Engine — INSTINCT Integration Spec

INSTINCT treats the Mac as a first-class audio host. This document captures the
Apple-side stack we target, the exact sample-rate / bit-depth contract we
support, and the mapping between that native stack and the WebAudio fallback
that keeps the browser build fully audible.

## Stack layers we bind to

1. **HAL — Core Audio HAL (`AudioHardware.h`, `AudioObject.h`)**
   Raw device discovery and sample-rate negotiation. We read:
   `kAudioHardwarePropertyDevices`, `kAudioDevicePropertyNominalSampleRate`,
   `kAudioDevicePropertyAvailableNominalSampleRates`,
   `kAudioDevicePropertyStreamFormat`,
   `kAudioDevicePropertyBufferFrameSize`,
   `kAudioDevicePropertyBufferFrameSizeRange`,
   `kAudioDevicePropertyLatency`,
   `kAudioDevicePropertyPreferredChannelsForStereo`.

2. **AudioUnit — AUv2 (`AudioToolbox/AUComponent.h`)**
   Default output unit (`kAudioUnitSubType_DefaultOutput`) and HAL output unit
   (`kAudioUnitSubType_HALOutput`) are our render targets on macOS. We host
   third-party AU plug-ins via `AUAudioUnit` (v3) and classic `AUGraph`-style
   chains via `AVAudioEngine`.

3. **AVAudioEngine (`AVFAudio`)**
   Our high-level mixer graph: `AVAudioPlayerNode` → `AVAudioUnitEQ` →
   `AVAudioUnitReverb` → `AVAudioUnitTimePitch` → `mainMixerNode` → `outputNode`.
   `AVAudioSourceNode` / `AVAudioSinkNode` let us insert custom DSP where the
   Rust side takes over.

4. **AudioToolbox — ExtAudioFile**
   File I/O + live sample-rate conversion when the project SR differs from the
   device SR. Backed by the AU Converter (`kAudioUnitSubType_AUConverter`).

5. **CoreMIDI (`CoreMIDI/MIDIServices.h`)**
   Input/output enumeration, virtual source/destination for INSTINCT's own
   routing, timestamped dispatch via `MIDIPacketList`.

6. **AVAudioSession (iOS / iPadOS companion)** — category `playAndRecord`,
   mode `default`, options `mixWithOthers | allowBluetoothA2DP`.

## Sample rate matrix

INSTINCT advertises and honours the full pro-audio range:

| Hz      | Common use                                   |
|---------|----------------------------------------------|
| 44 100  | CD / streaming master                        |
| 48 000  | Film / broadcast / most USB interfaces       |
| 88 200  | Mastering headroom over 44.1 kHz projects    |
| 96 000  | HD audio, post production                    |
| 176 400 | Archival capture, SACD upsample              |
| 192 000 | HD studio masters, modular / eurorack capture |

The engine always runs a 32-bit float internal bus and converts at the device
boundary. The supported file / export bit depths are 16, 24 and 32.

## Internal bus format

```
signal format   = Float32 (non-interleaved planar when routed through
                   AVAudioEngine, interleaved on cpal streams)
bit depth       = 32-bit float internal; 16 / 24 / 32 at export
channels        = 2 (stereo mix) + N auxiliary buses
```

## Mapping to the WebAudio fallback

When INSTINCT runs in the browser (Safari / Chromium) we fall back to
`AudioContext`. The mapping is designed so that moving between the two paths
requires no UI changes:

| Native (CoreAudio)          | WebAudio equivalent                           |
|-----------------------------|------------------------------------------------|
| `AUAudioUnit` render block  | `AudioWorkletNode` + worklet processor         |
| `AVAudioEngine` mainMixer   | `GainNode` + `AnalyserNode` master             |
| `AVAudioPlayerNode`         | `AudioBufferSourceNode`                        |
| Device picker (HAL)         | `navigator.mediaDevices.enumerateDevices()`    |
| Output device routing       | `AudioContext.setSinkId()`                     |
| ExtAudioFile SR conversion  | `OfflineAudioContext` render at target SR      |
| CoreMIDI input              | `navigator.requestMIDIAccess()`                |

## Bridge surface (Tauri → Rust)

The Rust side (`src-tauri/src/audio.rs`) exposes Tauri commands consumed by
`lib/audio/coreAudioBridge.ts`:

```
audio_list_devices()              -> AudioDevice[]
audio_get_device()                -> DeviceId
audio_set_device(id: DeviceId)    -> ()
audio_list_sample_rates(id)       -> number[]
audio_set_sample_rate(hz: f64)    -> ()
audio_set_bit_depth(bits: u16)    -> ()
audio_buffer_size_range()         -> { min, max, current }
audio_set_buffer_size(frames: u32)-> ()
audio_transport_play()            -> ()
audio_transport_stop()            -> ()
audio_master_level()              -> { peak: f32, rms: f32 }
audio_load_clip(path, trackId)    -> ClipHandle
```

Rust uses `cpal` for cross-platform device enumeration and `coreaudio-rs` for
macOS-specific HAL properties and AudioUnit rendering. The two crates live
side-by-side: cpal drives the main output stream; coreaudio-rs is only reached
when the user opts into "native Core Audio priority" in Preferences.

## Latency targets

| Buffer size | 48 kHz round-trip (approx) | Use                         |
|-------------|-----------------------------|-----------------------------|
| 32  samples | 1.3 ms                      | Tracking, MPE controllers   |
| 64          | 2.7 ms                      | Hybrid tracking / mixing    |
| 128         | 5.3 ms                      | Mixing default              |
| 256         | 10.6 ms                     | Heavy mix, many plug-ins    |
| 512         | 21.3 ms                     | Offline / render passes     |

## Exports

Broadcast WAV (BWF) already matches this matrix (`lib/interop/bwf.ts`). Project
save/load, AAF, ALS, RPP, Logic, FL, Reason and Studio One exports all carry the
engine's sample rate / bit depth through unchanged.
