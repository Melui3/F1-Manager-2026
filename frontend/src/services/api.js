// src/services/api.js

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function joinUrl(base, path) {
    if (!base) return path; // fallback (dev), but in prod you want VITE_API_BASE set
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
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

    setTokens({ access: data?.access, refresh: data?.refresh });
    return data?.access || null;
}

export async function apiFetch(path, options = {}) {
    const url = joinUrl(API_BASE, path);

    const makeHeaders = () => {
        const token = getAccessToken();
        const headers = { ...(options.headers || {}) };

        // JSON header only if not FormData
        const isFormData = options.body instanceof FormData;
        if (!isFormData && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    let res = await fetch(url, { ...options, headers: makeHeaders() });

    // Refresh on 401
    if (res.status === 401) {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
            res = await fetch(url, { ...options, headers: makeHeaders() });
        }
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

    setTokens({ access: data?.access, refresh: data?.refresh });
    return data;
}

export function logout() {
    clearTokens();
}