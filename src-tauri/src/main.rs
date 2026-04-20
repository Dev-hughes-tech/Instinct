// INSTINCT — Tauri desktop shell entry point.
//
// Hosts the native CoreAudio / cpal audio engine and exposes it to the Next.js
// UI via Tauri commands declared in `audio.rs`.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;

use audio::EngineState;

fn main() {
    tauri::Builder::default()
        .manage(EngineState::new())
        .invoke_handler(tauri::generate_handler![
            audio::audio_list_devices,
            audio::audio_get_state,
            audio::audio_set_device,
            audio::audio_set_sample_rate,
            audio::audio_set_bit_depth,
            audio::audio_set_buffer_size,
            audio::audio_transport_play,
            audio::audio_transport_stop,
            audio::audio_set_tempo,
            audio::audio_set_metronome,
            audio::audio_master_level,
            audio::audio_audition,
            audio::audio_all_notes_off,
            audio::audio_open_plugin,
            audio::audio_close_plugin,
            audio::audio_set_plugin_param,
            audio::audio_dispose
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("INSTINCT failed to start.");
}
