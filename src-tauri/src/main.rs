// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
async fn create_window(app: tauri::AppHandle) {
    let webview_window = tauri::WebviewWindowBuilder::new(
        &app,
        "label",
        tauri::WebviewUrl::App("/spacemanager".into()),
    )
    .title("Space Manager")
    .build()
    .unwrap();
}

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![create_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
