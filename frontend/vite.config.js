import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, isPreview }) => ({
    plugins: [
        react(),
        tailwindcss(),
        {
            name: "release-version",
            apply: "build",
            generateBundle() {
                this.emitFile({
                    type: "asset",
                    fileName: "version.json",
                    source: JSON.stringify({ commit: process.env.GITHUB_SHA || "local", builtAt: new Date().toISOString() }),
                });
            },
        },
    ],
    base: command === "build" || isPreview ? "/F1-Manager-2026/" : "/",
}));
