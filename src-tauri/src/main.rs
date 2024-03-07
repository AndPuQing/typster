// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
async fn open_docs(handle: tauri::AppHandle) {
    let docs_window = tauri::WindowBuilder::new(
        &handle,
        "external", /* the unique window label */
        tauri::WindowUrl::External("https://tauri.app/".parse().unwrap()),
    )
    .build()
    .unwrap();
}

fn main() {
    tauri::Builder::default()
        .setup(|app| Ok(()))
        .invoke_handler(tauri::generate_handler![open_docs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
