// src/services/api.js

// ✅ Mets l'URL Render en prod via .env.production : VITE_API_BASE=https://xxxxx.onrender.com
// ✅ Mets l'URL locale en dev via .env.development : VITE_API_BASE=http://127.0.0.1:8001
console.log("VITE_API_BASE =", import.meta.env.VITE_API_BASE);
console.log("API_BASE =", (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, ""));
const API_BASE = import.meta.env.DEV
    ? "http://127.0.0.1:8001"
    : "https://f1-manager-2026.onrender.com";


// Concat propre : joinUrl("https://x.com", "/api/teams/") => "https://x.com/api/teams/"
function joinUrl(base, path) {
    const b = String(base || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return b ? `${b}/${p}` : `/${p}`; // si base vide, on garde un chemin relatif
}

export function getAccessToken() {
    return localStorage.getItem("access_token");
}

export function getRefreshToken() {
    return localStorage.getItem("refresh_token");
}

export function setTokens({ access, refresh }) {
    if (access) localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

async function safeJson(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { raw: text };
    }
}

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    const url = joinUrl(API_BASE, "/api/auth/refresh/");
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        clearTokens();
        return null;
    }

    // simplejwt refresh renvoie { access } (parfois access + refresh selon config)
    setTokens({ access: data?.access, refresh: data?.refresh });
    return data?.access || null;
}

export async function apiFetch(path, options = {}) {
    const url = joinUrl(API_BASE, path);

    const makeHeaders = () => {
        const token = getAccessToken();
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    // 1er essai
    let res = await fetch(url, {
        ...options,
        headers: makeHeaders(),
    });

    // si 401 → refresh → retry 1 fois
    if (res.status === 401) {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
            res = await fetch(url, {
                ...options,
                headers: makeHeaders(),
            });
        }
    }

    if (res.status === 401) {
        const body = await safeJson(res);
        const err = new Error(body?.detail || "Unauthorized");
        err.status = 401;
        err.body = body;
        throw err;
    }

    if (!res.ok) {
        const body = await safeJson(res);
        const err = new Error(body?.detail || `HTTP ${res.status}`);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return safeJson(res);
}

export async function login(username, password) {
    const url = joinUrl(API_BASE, "/api/auth/login/");
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const err = new Error(data?.detail || "Login failed");
        err.status = res.status;
        err.body = data;
        throw err;
    }

    // ✅ simplejwt => {access, refresh}
    setTokens({ access: data?.access, refresh: data?.refresh });
    return data;
}

export async function logout() {
    clearTokens();
}