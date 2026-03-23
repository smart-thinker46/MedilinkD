const fs = require("node:fs");
const path = require("node:path");

// Defensive patch: we have seen a corrupted esbuild install where
// `node_modules/esbuild/lib/main.js` contains `else clear` which crashes Vite.
// This script repairs that line during `npm install`.

function patchEsbuildMain() {
  const target = path.join(__dirname, "..", "node_modules", "esbuild", "lib", "main.js");
  if (!fs.existsSync(target)) return { status: "missing" };

  const src = fs.readFileSync(target, "utf8");
  if (!src.includes("else clear")) return { status: "ok" };

  const before = "if (packet.value.error) callback(packet.value.error, {});\n      else clear\n      callback(null, packet.value);";
  const after = "if (packet.value.error) callback(packet.value.error, {});\n      else callback(null, packet.value);";

  if (!src.includes(before)) {
    // Try a broader, whitespace-tolerant replacement as a fallback.
    const patched = src.replace(
      /if\s*\(packet\.value\.error\)\s*callback\(packet\.value\.error,\s*\{\}\);\s*[\r\n]+\s*else\s+clear\s*[\r\n]+\s*callback\(null,\s*packet\.value\);\s*/m,
      `${after}\n`,
    );
    if (patched === src) return { status: "unmatched" };
    fs.writeFileSync(target, patched, "utf8");
    return { status: "patched" };
  }

  fs.writeFileSync(target, src.replace(before, after), "utf8");
  return { status: "patched" };
}

try {
  const res = patchEsbuildMain();
  // Keep postinstall quiet unless we actually changed something.
  if (res.status === "patched") {
    console.log("[postinstall] patched esbuild corrupted main.js");
  }
} catch (err) {
  // Don't fail install; dev server can still run if esbuild is healthy.
  console.warn("[postinstall] esbuild patch failed:", err?.message || String(err));
}

