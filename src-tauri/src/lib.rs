// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if has_suspicious_runtime_flags() {
        std::process::exit(1);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
