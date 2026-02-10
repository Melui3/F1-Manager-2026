// src/services/api.js

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

// Compat: si tu utilises mon GameContext persistant
const CTX_USER_KEY = "f1m26_user"; // contient { accessToken, refreshToken } chez toi

// Compat: ton ancien système
const LEGACY_ACCESS = "access_token";
const LEGACY_REFRESH = "refresh_token";

function joinUrl(base, path) {
    if (!base) return path;
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function safeParse(raw) {
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function getCtxTokens() {
    const u = safeParse(localStorage.getItem(CTX_USER_KEY));
    return {
        access: u?.accessToken || null,
        refresh: u?.refreshToken || null,
    };
}

function setCtxTokens({ access, refresh }) {
    const u = safeParse(localStorage.getItem(CTX_USER_KEY)) || {};
    const next = {
        ...u,
        accessToken: access ?? u.accessToken ?? null,
        refreshToken: refresh ?? u.refreshToken ?? null,
    };
    localStorage.setItem(CTX_USER_KEY, JSON.stringify(next));
}

export function getAccessToken() {
    // 1) priorité au GameContext persistant
    const ctx = getCtxTokens();
    if (ctx.access) return ctx.access;

    // 2) fallback legacy
    return localStorage.getItem(LEGACY_ACCESS);
}

export function getRefreshToken() {
    const ctx = getCtxTokens();
    if (ctx.refresh) return ctx.refresh;

    return localStorage.getItem(LEGACY_REFRESH);
}

export function setTokens({ access, refresh }) {
    // write legacy
    if (access) localStorage.setItem(LEGACY_ACCESS, access);
    if (refresh) localStorage.setItem(LEGACY_REFRESH, refresh);

    // write context storage too
    if (access || refresh) setCtxTokens({ access, refresh });
}

export function clearTokens() {
    localStorage.removeItem(LEGACY_ACCESS);
    localStorage.removeItem(LEGACY_REFRESH);

    // clear in f1m26_user but keep other fields (username/avatar)
    const u = safeParse(localStorage.getItem(CTX_USER_KEY));
    if (u) {
        localStorage.setItem(
            CTX_USER_KEY,
            JSON.stringify({ ...u, accessToken: null, refreshToken: null })
        );
    }
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

    const access = data?.access || null;
    const newRefresh = data?.refresh || refresh || null;

    setTokens({ access, refresh: newRefresh });
    return access;
}

/**
 * apiFetch(path, options)
 * options.authToken : si tu veux forcer un token spécifique (optionnel)
 */
export async function apiFetch(path, options = {}) {
    const url = joinUrl(API_BASE, path);

    const makeHeaders = (forcedToken) => {
        const token = forcedToken || options.authToken || getAccessToken();
        const headers = { ...(options.headers || {}) };

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
            res = await fetch(url, { ...options, headers: makeHeaders(newAccess) });
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

    // stocke partout (legacy + f1m26_user)
    setTokens({ access: data?.access, refresh: data?.refresh });

    return data;
}

export function logout() {
    clearTokens();
}