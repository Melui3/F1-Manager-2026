// src/services/api.js
const API_BASE = "";

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

    const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
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
    let res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: makeHeaders(),
    });

    // si 401 → refresh → retry 1 fois
    if (res.status === 401) {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
            res = await fetch(`${API_BASE}${path}`, {
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
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
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