// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod compilers;
mod editor;

#[tauri::command]
fn tokenize_tauri(code: &str) -> Vec<u32> {
    editor::tokenize(code)
}

#[tauri::command]
fn get_legend() -> Vec<String> {
    editor::get_token_legend()
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![tokenize_tauri, get_legend,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
