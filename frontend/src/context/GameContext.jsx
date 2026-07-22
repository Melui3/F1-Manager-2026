import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    activateSessionProfile,
    clearActiveSessionSelection,
    getActiveSessionId,
    getSessionProfiles,
    getScopedStorageKey,
    touchSessionProfile,
    updateActiveSessionMeta,
} from "../services/sessionStore";

const GameContext = createContext(null);

const base = import.meta.env.BASE_URL || "/";

function defaultSim() {
    return {
        season: 2026,
        currentRound: 0,
        lastResults: null,
        standings: null,
    };
}

function avatarUrlFromKey(key) {
    if (!key) return null;
    return `${base}avatars/${key}.jpg`;
}

function normalizeUrl(url) {
    if (!url) return null;
    const s = String(url);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `${base}${s.replace(/^\//, "")}`;
}

function safeParse(raw) {
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function GameProvider({ children }) {
    const [ready, setReady] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(null);

    const [userName, setUserName] = useState("");
    const [avatarKey, setAvatarKey] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);

    const [team, setTeam] = useState(null);
    const [driver, setDriver] = useState(null);
    const [sim, setSim] = useState(defaultSim());

    const clearRuntimeState = () => {
        setUserName("");
        setAvatarKey(null);
        setUserAvatar(null);
        setAccessToken(null);
        setRefreshToken(null);
        setTeam(null);
        setDriver(null);
        setSim(defaultSim());
    };

    const loadSession = (sessionId = getActiveSessionId()) => {
        setReady(false);

        if (sessionId && !getSessionProfiles().some((profile) => profile.id === sessionId)) {
            sessionId = null;
        }

        if (!sessionId) {
            setActiveSessionId(null);
            clearRuntimeState();
            setReady(true);
            return;
        }

        const u = safeParse(localStorage.getItem(getScopedStorageKey("user", sessionId))) || {};
        const g = safeParse(localStorage.getItem(getScopedStorageKey("game", sessionId))) || {};
        const nextAvatarKey = u.avatarKey || u.avatar_key || null;
        const nextAvatarUrl = u.userAvatar || u.avatar_url || null;

        setActiveSessionId(sessionId);
        setUserName(u.userName || u.username || "");
        setAvatarKey(nextAvatarKey);
        setUserAvatar(nextAvatarUrl ? normalizeUrl(nextAvatarUrl) : avatarUrlFromKey(nextAvatarKey));
        setAccessToken(u.accessToken || u.access || "local-token");
        setRefreshToken(u.refreshToken || u.refresh || "local-refresh");
        setTeam(g.team || null);
        setDriver(g.driver || null);
        setSim(g.sim || defaultSim());

        touchSessionProfile(sessionId);
        setReady(true);
    };

    useEffect(() => {
        loadSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!ready || !activeSessionId) return;

        localStorage.setItem(
            getScopedStorageKey("user", activeSessionId),
            JSON.stringify({
                userName,
                avatarKey,
                userAvatar,
                accessToken,
                refreshToken,
            })
        );

        updateActiveSessionMeta({ name: userName || "Manager", avatarKey: avatarKey || "verstappen" });
    }, [ready, activeSessionId, userName, avatarKey, userAvatar, accessToken, refreshToken]);

    useEffect(() => {
        if (!ready || !activeSessionId) return;

        localStorage.setItem(
            getScopedStorageKey("game", activeSessionId),
            JSON.stringify({
                team,
                driver,
                sim,
            })
        );

        touchSessionProfile(activeSessionId);
    }, [ready, activeSessionId, team, driver, sim]);

    const activateSession = (sessionId) => {
        activateSessionProfile(sessionId);
        loadSession(sessionId);
    };

    const refreshSession = () => {
        loadSession(activeSessionId || getActiveSessionId());
    };

    const applyLogin = ({ tokens, me, fallbackUsername }) => {
        const access = tokens?.access || "local-token";
        const refresh = tokens?.refresh || "local-refresh";
        const name = me?.username || fallbackUsername || userName || "Manager";
        const aKey = me?.avatar_key || avatarKey || "verstappen";
        const aUrl = me?.avatar_url || null;

        setAccessToken(access);
        setRefreshToken(refresh);
        setUserName(name);

        if (aUrl) {
            setUserAvatar(normalizeUrl(aUrl));
            setAvatarKey(aKey);
        } else {
            setAvatarKey(aKey);
            setUserAvatar(avatarUrlFromKey(aKey));
        }
    };

    const applyAvatar = ({ avatar_key }) => {
        const nextKey = avatar_key || null;
        setAvatarKey(nextKey);
        setUserAvatar(nextKey ? avatarUrlFromKey(nextKey) : null);
        updateActiveSessionMeta({ avatarKey: nextKey || "verstappen" });
    };

    const logout = () => {
        clearActiveSessionSelection();
        setActiveSessionId(null);
        clearRuntimeState();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    };

    const isAuthenticated = useMemo(() => !!activeSessionId, [activeSessionId]);

    return (
        <GameContext.Provider
            value={{
                ready,
                activeSessionId,
                activateSession,
                refreshSession,

                userName,
                setUserName,
                avatarKey,
                setAvatarKey,
                userAvatar,
                setUserAvatar,

                accessToken,
                refreshToken,
                setAccessToken,
                setRefreshToken,
                isAuthenticated,
                applyLogin,
                applyAvatar,
                logout,

                team,
                setTeam,
                driver,
                setDriver,
                sim,
                setSim,
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGame must be used inside GameProvider");
    return ctx;
}
