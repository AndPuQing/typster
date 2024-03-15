// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod editor;

#[tauri::command]
fn tokenize_code(code: &str) -> Vec<u32> {
    editor::tokenize(code)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![tokenize_code])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
