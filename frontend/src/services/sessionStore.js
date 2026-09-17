const INDEX_KEY = "f1m26_session_index";
const ACTIVE_KEY = "f1m26_active_session";

const LEGACY_KEYS = {
    user: "f1m26_user",
    game: "f1m26_game",
    mock: "f1m26_mock",
};

const STORAGE_SLOTS = ["user", "game", "mock"];

function safeParse(raw, fallback = null) {
    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function nowIso() {
    return new Date().toISOString();
}

function slugify(value) {
    const slug = String(value || "manager")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 28);
    return slug || "manager";
}

function createId(name) {
    return `${slugify(name)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function scopedKey(sessionId, slot) {
    return `f1m26_session_${sessionId}_${slot}`;
}

function readIndexRaw() {
    const sessions = safeParse(localStorage.getItem(INDEX_KEY), []);
    return Array.isArray(sessions) ? sessions : [];
}

function writeIndex(sessions) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(sessions));
}

function readLegacyName() {
    const user = safeParse(localStorage.getItem(LEGACY_KEYS.user), {});
    return user?.userName || user?.username || "Manager";
}

function readLegacyAvatar() {
    const user = safeParse(localStorage.getItem(LEGACY_KEYS.user), {});
    return user?.avatarKey || user?.avatar_key || "verstappen";
}

export function migrateLegacySession() {
    if (readIndexRaw().length > 0) return;

    const hasLegacyData = STORAGE_SLOTS.some((slot) => localStorage.getItem(LEGACY_KEYS[slot]) != null);
    if (!hasLegacyData) return;

    const createdAt = nowIso();
    const profile = {
        id: createId(readLegacyName()),
        name: readLegacyName(),
        avatarKey: readLegacyAvatar(),
        createdAt,
        updatedAt: createdAt,
    };

    for (const slot of STORAGE_SLOTS) {
        const raw = localStorage.getItem(LEGACY_KEYS[slot]);
        if (raw != null) localStorage.setItem(scopedKey(profile.id, slot), raw);
    }

    if (localStorage.getItem(scopedKey(profile.id, "user")) == null) {
        localStorage.setItem(
            scopedKey(profile.id, "user"),
            JSON.stringify({
                userName: profile.name,
                avatarKey: profile.avatarKey,
                userAvatar: null,
            })
        );
    }

    writeIndex([profile]);
    localStorage.setItem(ACTIVE_KEY, profile.id);
}

export function getSessionProfiles() {
    migrateLegacySession();
    return readIndexRaw().sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

export function getActiveSessionId() {
    migrateLegacySession();
    const active = localStorage.getItem(ACTIVE_KEY);
    if (!active) return null;
    return readIndexRaw().some((profile) => profile.id === active) ? active : null;
}

export function getScopedStorageKey(slot, sessionId = getActiveSessionId()) {
    if (!sessionId) return LEGACY_KEYS[slot] || `f1m26_${slot}`;
    return scopedKey(sessionId, slot);
}

export function activateSessionProfile(sessionId) {
    const sessions = readIndexRaw();
    if (!sessions.some((profile) => profile.id === sessionId)) {
        throw new Error("Session introuvable.");
    }
    localStorage.setItem(ACTIVE_KEY, sessionId);
    touchSessionProfile(sessionId);
}

export function clearActiveSessionSelection() {
    localStorage.removeItem(ACTIVE_KEY);
}

export function createSessionProfile(name, avatarKey = "verstappen") {
    const createdAt = nowIso();
    const profile = {
        id: createId(name),
        name: String(name || "Manager").trim() || "Manager",
        avatarKey: avatarKey || "verstappen",
        createdAt,
        updatedAt: createdAt,
    };

    const sessions = readIndexRaw();
    writeIndex([profile, ...sessions]);
    localStorage.setItem(ACTIVE_KEY, profile.id);
    localStorage.setItem(
        scopedKey(profile.id, "user"),
        JSON.stringify({
            userName: profile.name,
            avatarKey: profile.avatarKey,
            userAvatar: null,
        })
    );
    return profile;
}

export function touchSessionProfile(sessionId = getActiveSessionId()) {
    if (!sessionId) return;
    const sessions = readIndexRaw();
    writeIndex(sessions.map((profile) => (
        profile.id === sessionId ? { ...profile, updatedAt: nowIso() } : profile
    )));
}

export function updateActiveSessionMeta(meta = {}) {
    const sessionId = getActiveSessionId();
    if (!sessionId) return;

    const sessions = readIndexRaw();
    writeIndex(sessions.map((profile) => (
        profile.id === sessionId
            ? {
                ...profile,
                ...meta,
                name: meta.name || profile.name,
                avatarKey: meta.avatarKey || profile.avatarKey,
                updatedAt: nowIso(),
            }
            : profile
    )));
}

export function deleteSessionProfile(sessionId) {
    for (const slot of STORAGE_SLOTS) localStorage.removeItem(scopedKey(sessionId, slot));
    writeIndex(readIndexRaw().filter((profile) => profile.id !== sessionId));
    if (localStorage.getItem(ACTIVE_KEY) === sessionId) localStorage.removeItem(ACTIVE_KEY);
}

export function resetSessionProfile(sessionId) {
    localStorage.removeItem(scopedKey(sessionId, "game"));
    localStorage.removeItem(scopedKey(sessionId, "mock"));
    touchSessionProfile(sessionId);
}

export function clearActiveSessionData() {
    const sessionId = getActiveSessionId();
    if (!sessionId) return;
    deleteSessionProfile(sessionId);
}

export function exportSessionPayload(sessionId = getActiveSessionId()) {
    const profile = readIndexRaw().find((item) => item.id === sessionId);
    if (!profile) throw new Error("Aucune session active a exporter.");

    const data = {};
    for (const slot of STORAGE_SLOTS) {
        const value = localStorage.getItem(scopedKey(sessionId, slot));
        if (value != null) data[slot] = value;
    }

    return {
        app: "F1 Manager 2026",
        version: 2,
        exportedAt: nowIso(),
        profile,
        data,
    };
}

export function importSessionPayload(payload) {
    if (!payload || payload.app !== "F1 Manager 2026" || !payload.data) {
        throw new Error("Sauvegarde invalide.");
    }

    const profile = {
        ...(payload.profile || {}),
        id: createId(payload.profile?.name || "Manager"),
        name: payload.profile?.name || "Manager",
        avatarKey: payload.profile?.avatarKey || "verstappen",
        createdAt: nowIso(),
        updatedAt: nowIso(),
    };

    for (const slot of STORAGE_SLOTS) {
        const raw = payload.data[slot] ?? payload.data[LEGACY_KEYS[slot]];
        if (raw != null) {
            JSON.parse(raw);
            localStorage.setItem(scopedKey(profile.id, slot), raw);
        }
    }

    writeIndex([profile, ...readIndexRaw()]);
    localStorage.setItem(ACTIVE_KEY, profile.id);
    return profile;
}
