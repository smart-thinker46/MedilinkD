// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn has_suspicious_runtime_flags() -> bool {
    // Only enforce strict anti-inspection checks in release builds.
    #[cfg(debug_assertions)]
    {
        return false;
    }
    #[cfg(not(debug_assertions))]
    {
        let suspicious_tokens = [
            "--inspect",
            "--inspect-brk",
            "--remote-debugging-port",
            "--remote-debugging-address",
            "--devtools",
            "--open-devtools",
        ];
        std::env::args().any(|arg| {
            let lower = arg.to_ascii_lowercase();
            suspicious_tokens.iter().any(|token| lower.contains(token))
        })
    }
}

fn main() {
    if has_suspicious_runtime_flags() {
        std::process::exit(1);
    }
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
