import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// ⚠️ Mets EXACTEMENT le nom de ton repo GitHub ici
const REPO_NAME = "F1-Manager-2026";

export default defineConfig(({ command }) => ({
    plugins: [react(), tailwindcss()],

    // ✅ GitHub Pages: base obligatoire en build
    base: command === "build" ? `/${REPO_NAME}/` : "/",

    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:8001",
                changeOrigin: true,
            },
            "/admin": {
                target: "http://127.0.0.1:8001",
                changeOrigin: true,
            },
        },
    },
}));