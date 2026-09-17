import { mockDispatch } from "./mockApi.js";
import {
    clearActiveSessionData,
    exportSessionPayload,
    getScopedStorageKey,
    importSessionPayload,
} from "./sessionStore.js";

// Keep the existing game commands, but always execute them in this browser.
export async function apiFetch(path, options = {}) {
    if (path.startsWith("/api/live-race/") && options.method === "POST" && globalThis.navigator?.locks) {
        const sessionKey = getScopedStorageKey("mock");
        return navigator.locks.request(`live-race:${sessionKey}`, () => {
            if (getScopedStorageKey("mock") !== sessionKey) throw new Error("La session active a changé.");
            return mockDispatch(path, options);
        });
    }
    return mockDispatch(path, options);
}

export function exportLocalSave() {
    return exportSessionPayload();
}

export function importLocalSave(payload) {
    return importSessionPayload(payload);
}

export function clearLocalSave() {
    clearActiveSessionData();
}
