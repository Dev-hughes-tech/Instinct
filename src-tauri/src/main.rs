// INSTINCT — Tauri desktop shell entry point.
// All real audio I/O, VST3/AU/AAX hosting, and CoreMIDI bindings are planned
// for this process. Today, the UI lives in the Next.js frontend.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("INSTINCT failed to start.");
}
