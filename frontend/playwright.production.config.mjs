import { defineConfig } from "@playwright/test";

const remote = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
    testDir: "./tests/production",
    timeout: 90000,
    workers: 1,
    use: {
        baseURL: remote || "http://127.0.0.1:4173/F1-Manager-2026/",
        viewport: { width: 1440, height: 1000 },
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        launchOptions: { args: ["--enable-unsafe-swiftshader"] },
        trace: "retain-on-failure",
    },
    webServer: remote ? undefined : {
        command: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort",
        url: "http://127.0.0.1:4173/F1-Manager-2026/",
        reuseExistingServer: false,
    },
});
