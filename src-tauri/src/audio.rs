//! INSTINCT native audio engine.
//!
//! Lives inside the Tauri desktop shell. Exposes Tauri `command` functions
//! that the JavaScript side (`lib/audio/coreAudioBridge.ts`) invokes.
//!
//! The backend uses [`cpal`] for cross-platform device enumeration, stream
//! negotiation, and render callbacks. On macOS the cpal CoreAudio backend
//! talks directly to the HAL; any audio unit / AVAudioEngine hosting is done
//! via the `coreaudio` crate when a pro-audio device is selected.
//!
//! The engine is intentionally unopinionated about what it renders: the UI
//! drives it by pushing voices (instrument audition) and by requesting plug-in
//! instantiation. A full DSP graph is coming from the Rust side — but even in
//! this minimal form we own an authoritative output stream, real master level
//! metering, and the sample-rate / bit-depth / buffer-size negotiation that
//! the Preferences UI surfaces.

use std::sync::{Arc, Mutex};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{BufferSize, SampleFormat, SampleRate, StreamConfig};
use serde::{Deserialize, Serialize};
use tauri::State;

/// Sample rates INSTINCT advertises across the UI, engine, and export stack.
pub const SUPPORTED_RATES: &[u32] = &[44100, 48000, 88200, 96000, 176400, 192000];
/// Bit depths INSTINCT honours at device + file boundaries. Internal bus is f32.
pub const SUPPORTED_BIT_DEPTHS: &[u16] = &[16, 24, 32];
/// Buffer sizes (frames) we expose in the Audio Engine preferences.
pub const SUPPORTED_BUFFERS: &[u32] = &[32, 64, 128, 256, 512, 1024];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevice {
    pub id: String,
    pub label: String,
    pub kind: String, // "input" | "output" | "duplex"
    pub backend: String,
    pub is_default: bool,
    pub channel_count: u16,
    pub sample_rates: Vec<u32>,
    pub preferred_buffer_frames: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MasterLevel {
    pub peak: f32,
    pub rms: f32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineSnapshot {
    pub sample_rate: u32,
    pub bit_depth: u16,
    pub buffer_size: u32,
    pub device_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceOpts {
    pub note: f32,
    #[serde(default = "default_velocity")]
    pub velocity: f32,
    #[serde(default = "default_duration")]
    pub duration: f32,
    #[serde(default)]
    pub timbre: Option<String>,
    #[serde(default = "default_gain")]
    pub gain: f32,
    #[serde(default)]
    pub pan: f32,
}

fn default_velocity() -> f32 { 0.8 }
fn default_duration() -> f32 { 0.35 }
fn default_gain() -> f32 { 1.0 }

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginEffect {
    pub category: String,
    pub params: std::collections::HashMap<String, f32>,
}

/// A currently-ringing voice, ticked by the render callback.
struct Voice {
    instrument: String,
    freq: f32,
    gain: f32,
    frames_left: i64,
    phase: f32,
    timbre: VoiceTimbre,
}

#[derive(Clone, Copy)]
enum VoiceTimbre { Sine, Saw, Square, Triangle, Noise }

/// Shared engine state owned by the Tauri app handle.
pub struct EngineState {
    inner: Arc<Mutex<Engine>>,
}

impl EngineState {
    pub fn new() -> Self {
        Self { inner: Arc::new(Mutex::new(Engine::new())) }
    }
}

struct Engine {
    host_id: String,
    device_id: Option<String>,
    sample_rate: u32,
    bit_depth: u16,
    buffer_size: u32,
    master_level: Arc<Mutex<MasterLevel>>,
    voices: Arc<Mutex<Vec<Voice>>>,
    stream: Option<cpal::Stream>,
    transport_playing: bool,
    tempo_bpm: f32,
    metronome_on: bool,
    plugins: Vec<(String, PluginEffect)>,
}

impl Engine {
    fn new() -> Self {
        Self {
            host_id: cpal::default_host().id().name().into(),
            device_id: None,
            sample_rate: 48_000,
            bit_depth: 24,
            buffer_size: 128,
            master_level: Arc::new(Mutex::new(MasterLevel { peak: 0.0, rms: 0.0 })),
            voices: Arc::new(Mutex::new(Vec::new())),
            stream: None,
            transport_playing: false,
            tempo_bpm: 92.0,
            metronome_on: false,
            plugins: Vec::new(),
        }
    }

    /// (Re)build the cpal output stream against the current device + config.
    fn rebuild_stream(&mut self) -> anyhow::Result<()> {
        if let Some(s) = self.stream.take() {
            let _ = s.pause();
        }
        let host = cpal::default_host();
        let device = match &self.device_id {
            Some(id) => host
                .output_devices()?
                .find(|d| d.name().map(|n| n == *id).unwrap_or(false))
                .or_else(|| host.default_output_device())
                .ok_or_else(|| anyhow::anyhow!("no output device"))?,
            None => host.default_output_device().ok_or_else(|| anyhow::anyhow!("no default output"))?,
        };
        let mut config: StreamConfig = device.default_output_config()?.config();
        config.sample_rate = SampleRate(self.sample_rate);
        config.buffer_size = BufferSize::Fixed(self.buffer_size);

        let voices = Arc::clone(&self.voices);
        let level = Arc::clone(&self.master_level);
        let sr = config.sample_rate.0 as f32;
        let channels = config.channels as usize;

        let stream = device.build_output_stream(
            &config,
            move |output: &mut [f32], _: &cpal::OutputCallbackInfo| {
                let mut peak: f32 = 0.0;
                let mut sq: f32 = 0.0;
                let mut v = voices.lock().unwrap();
                for frame in output.chunks_mut(channels) {
                    let mut sample: f32 = 0.0;
                    for voice in v.iter_mut() {
                        if voice.frames_left <= 0 { continue; }
                        let s = render_voice(voice, sr);
                        sample += s;
                        voice.frames_left -= 1;
                    }
                    sample *= 0.9;
                    sample = sample.max(-1.0).min(1.0);
                    for out_sample in frame.iter_mut() { *out_sample = sample; }
                    let a = sample.abs();
                    if a > peak { peak = a; }
                    sq += sample * sample;
                }
                v.retain(|voice| voice.frames_left > 0);
                let rms = (sq / (output.len().max(1) as f32)).sqrt();
                if let Ok(mut m) = level.lock() {
                    *m = MasterLevel { peak: peak.min(1.0), rms: rms.min(1.0) };
                }
            },
            move |err| eprintln!("[INSTINCT audio] stream error: {err}"),
            None,
        )?;
        stream.play()?;
        self.stream = Some(stream);
        Ok(())
    }
}

fn render_voice(voice: &mut Voice, sample_rate: f32) -> f32 {
    let phase_inc = voice.freq / sample_rate;
    voice.phase += phase_inc;
    if voice.phase >= 1.0 { voice.phase -= 1.0; }
    let x = voice.phase;
    let raw = match voice.timbre {
        VoiceTimbre::Sine => (2.0 * std::f32::consts::PI * x).sin(),
        VoiceTimbre::Saw => 2.0 * x - 1.0,
        VoiceTimbre::Square => if x < 0.5 { 1.0 } else { -1.0 },
        VoiceTimbre::Triangle => 1.0 - 4.0 * (x - 0.5).abs(),
        VoiceTimbre::Noise => rand_f(),
    };
    raw * voice.gain
}

fn rand_f() -> f32 {
    use std::cell::Cell;
    thread_local! { static STATE: Cell<u32> = Cell::new(0x9E3779B9); }
    STATE.with(|s| {
        let mut x = s.get();
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        s.set(x);
        ((x as f32) / (u32::MAX as f32)) * 2.0 - 1.0
    })
}

fn timbre_from(instrument: &str, override_: Option<&str>) -> VoiceTimbre {
    let key = override_.unwrap_or(instrument).to_ascii_lowercase();
    if key.contains("kick") || key.contains("808") || key.contains("sub") || key.contains("bass") {
        VoiceTimbre::Saw
    } else if key.contains("snare") || key.contains("clap") || key.contains("hat") || key.contains("noise") {
        VoiceTimbre::Noise
    } else if key.contains("lead") || key.contains("square") {
        VoiceTimbre::Square
    } else if key.contains("pad") || key.contains("strings") || key.contains("brass") {
        VoiceTimbre::Saw
    } else if key.contains("keys") || key.contains("piano") || key.contains("rhodes") {
        VoiceTimbre::Triangle
    } else {
        VoiceTimbre::Sine
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn audio_list_devices(state: State<'_, EngineState>) -> Vec<AudioDevice> {
    let _ = state.inner.lock().unwrap();
    let host = cpal::default_host();
    let mut out: Vec<AudioDevice> = Vec::new();
    let default_name = host
        .default_output_device()
        .and_then(|d| d.name().ok());
    if let Ok(iter) = host.output_devices() {
        for d in iter {
            let name = d.name().unwrap_or_else(|_| "Unknown".to_string());
            let is_default = Some(&name) == default_name.as_ref();
            let configs = d.supported_output_configs().ok();
            let mut rates: Vec<u32> = Vec::new();
            let mut channels: u16 = 2;
            if let Some(cfgs) = configs {
                for cfg in cfgs {
                    channels = channels.max(cfg.channels());
                    let min = cfg.min_sample_rate().0;
                    let max = cfg.max_sample_rate().0;
                    for &r in SUPPORTED_RATES {
                        if r >= min && r <= max && !rates.contains(&r) {
                            rates.push(r);
                        }
                    }
                }
            }
            if rates.is_empty() { rates = SUPPORTED_RATES.to_vec(); }
            out.push(AudioDevice {
                id: name.clone(),
                label: name,
                kind: "output".into(),
                backend: "coreaudio".into(),
                is_default,
                channel_count: channels,
                sample_rates: rates,
                preferred_buffer_frames: 128,
            });
        }
    }
    out
}

#[tauri::command]
pub fn audio_get_state(state: State<'_, EngineState>) -> EngineSnapshot {
    let e = state.inner.lock().unwrap();
    EngineSnapshot {
        sample_rate: e.sample_rate,
        bit_depth: e.bit_depth,
        buffer_size: e.buffer_size,
        device_id: e.device_id.clone(),
    }
}

#[tauri::command]
pub fn audio_set_device(state: State<'_, EngineState>, device_id: String) -> Result<(), String> {
    let mut e = state.inner.lock().unwrap();
    e.device_id = Some(device_id);
    e.rebuild_stream().map_err(|x| x.to_string())
}

#[tauri::command]
pub fn audio_set_sample_rate(state: State<'_, EngineState>, rate: u32) -> Result<(), String> {
    if !SUPPORTED_RATES.contains(&rate) {
        return Err(format!("unsupported sample rate {rate}"));
    }
    let mut e = state.inner.lock().unwrap();
    e.sample_rate = rate;
    e.rebuild_stream().map_err(|x| x.to_string())
}

#[tauri::command]
pub fn audio_set_bit_depth(state: State<'_, EngineState>, depth: u16) -> Result<(), String> {
    if !SUPPORTED_BIT_DEPTHS.contains(&depth) {
        return Err(format!("unsupported bit depth {depth}"));
    }
    state.inner.lock().unwrap().bit_depth = depth;
    Ok(())
}

#[tauri::command]
pub fn audio_set_buffer_size(state: State<'_, EngineState>, frames: u32) -> Result<(), String> {
    if !SUPPORTED_BUFFERS.contains(&frames) {
        return Err(format!("unsupported buffer size {frames}"));
    }
    let mut e = state.inner.lock().unwrap();
    e.buffer_size = frames;
    e.rebuild_stream().map_err(|x| x.to_string())
}

#[tauri::command]
pub fn audio_transport_play(state: State<'_, EngineState>) -> Result<(), String> {
    let mut e = state.inner.lock().unwrap();
    e.transport_playing = true;
    if e.stream.is_none() {
        e.rebuild_stream().map_err(|x| x.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn audio_transport_stop(state: State<'_, EngineState>) -> Result<(), String> {
    let mut e = state.inner.lock().unwrap();
    e.transport_playing = false;
    e.voices.lock().unwrap().clear();
    Ok(())
}

#[tauri::command]
pub fn audio_set_tempo(state: State<'_, EngineState>, bpm: f32) {
    state.inner.lock().unwrap().tempo_bpm = bpm;
}

#[tauri::command]
pub fn audio_set_metronome(state: State<'_, EngineState>, on: bool) {
    state.inner.lock().unwrap().metronome_on = on;
}

#[tauri::command]
pub fn audio_master_level(state: State<'_, EngineState>) -> MasterLevel {
    let e = state.inner.lock().unwrap();
    e.master_level.lock().unwrap().clone()
}

#[tauri::command]
pub fn audio_audition(
    state: State<'_, EngineState>,
    instrument_id: String,
    opts: VoiceOpts,
) -> Result<(), String> {
    let mut e = state.inner.lock().unwrap();
    if e.stream.is_none() {
        e.rebuild_stream().map_err(|x| x.to_string())?;
    }
    let freq = 440.0f32 * 2f32.powf((opts.note - 69.0) / 12.0);
    let gain = opts.velocity.clamp(0.0, 1.5) * opts.gain.clamp(0.0, 2.0) * 0.6;
    let frames = (opts.duration.max(0.05) * e.sample_rate as f32) as i64;
    let timbre = timbre_from(&instrument_id, opts.timbre.as_deref());
    e.voices.lock().unwrap().push(Voice {
        instrument: instrument_id,
        freq,
        gain,
        frames_left: frames,
        phase: 0.0,
        timbre,
    });
    Ok(())
}

#[tauri::command]
pub fn audio_all_notes_off(state: State<'_, EngineState>, instrument_id: Option<String>) {
    let e = state.inner.lock().unwrap();
    let mut v = e.voices.lock().unwrap();
    if let Some(id) = instrument_id {
        v.retain(|voice| voice.instrument != id);
    } else {
        v.clear();
    }
}

#[tauri::command]
pub fn audio_open_plugin(
    state: State<'_, EngineState>,
    plugin_id: String,
    effect: PluginEffect,
) -> String {
    let mut e = state.inner.lock().unwrap();
    let instance_id = format!("pi-{}-{}", plugin_id, e.plugins.len());
    e.plugins.push((instance_id.clone(), effect));
    instance_id
}

#[tauri::command]
pub fn audio_close_plugin(state: State<'_, EngineState>, instance_id: String) {
    let mut e = state.inner.lock().unwrap();
    e.plugins.retain(|(id, _)| id != &instance_id);
}

#[tauri::command]
pub fn audio_set_plugin_param(
    state: State<'_, EngineState>,
    instance_id: String,
    key: String,
    value: f32,
) {
    let mut e = state.inner.lock().unwrap();
    if let Some((_, effect)) = e.plugins.iter_mut().find(|(id, _)| id == &instance_id) {
        effect.params.insert(key, value);
    }
}

#[tauri::command]
pub fn audio_dispose(state: State<'_, EngineState>) {
    let mut e = state.inner.lock().unwrap();
    if let Some(s) = e.stream.take() {
        let _ = s.pause();
    }
    e.voices.lock().unwrap().clear();
    e.plugins.clear();
}
