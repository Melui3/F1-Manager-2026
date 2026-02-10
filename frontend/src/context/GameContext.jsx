// src/context/GameContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const GameContext = createContext(null);

// 2 clés distinctes = plus propre
const STORAGE_USER = "f1m26_user";
const STORAGE_GAME = "f1m26_game";

const base = import.meta.env.BASE_URL || "/";

// Helpers
function avatarUrlFromKey(key) {
    if (!key) return null;
    return `${base}avatars/${key}.jpg`; // change en .png si besoin
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

    // ===== USER / AUTH =====
    const [userName, setUserName] = useState("");
    const [avatarKey, setAvatarKey] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);

    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);

    // ===== GAME =====
    const [team, setTeam] = useState(null);
    const [driver, setDriver] = useState(null);

    // Simulation “progress”
    // (tu peux enrichir quand tu veux : calendar, standings, results, currentRace, etc.)
    const [sim, setSim] = useState({
        season: 2026,
        currentRound: 0,
        lastResults: null,
        standings: null,
    });

    // ===== LOAD =====
    useEffect(() => {
        const u = safeParse(localStorage.getItem(STORAGE_USER));
        const g = safeParse(localStorage.getItem(STORAGE_GAME));

        if (u) {
            setUserName(u.userName || "");
            setAvatarKey(u.avatarKey || null);
            setUserAvatar(u.userAvatar || null);
            setAccessToken(u.accessToken || null);
            setRefreshToken(u.refreshToken || null);
        }

        if (g) {
            setTeam(g.team || null);
            setDriver(g.driver || null);
            setSim(
                g.sim || {
                    season: 2026,
                    currentRound: 0,
                    lastResults: null,
                    standings: null,
                }
            );
        }

        setReady(true);
    }, []);

    // ===== SAVE =====
    useEffect(() => {
        if (!ready) return;

        localStorage.setItem(
            STORAGE_USER,
            JSON.stringify({
                userName,
                avatarKey,
                userAvatar,
                accessToken,
                refreshToken,
            })
        );
    }, [ready, userName, avatarKey, userAvatar, accessToken, refreshToken]);

    useEffect(() => {
        if (!ready) return;

        localStorage.setItem(
            STORAGE_GAME,
            JSON.stringify({
                team,
                driver,
                sim,
            })
        );
    }, [ready, team, driver, sim]);

    // ===== ACTIONS =====

    // Appelé après login
    // me peut contenir avatar_key/avatar_url
    const applyLogin = ({ tokens, me, fallbackUsername }) => {
        const access = tokens?.access || null;
        const refresh = tokens?.refresh || null;

        setAccessToken(access);
        setRefreshToken(refresh);

        const name = me?.username || fallbackUsername || "";
        setUserName(name);

        const aKey = me?.avatar_key || null;
        const aUrl = me?.avatar_url || null;

        if (aUrl) {
            setUserAvatar(normalizeUrl(aUrl));
            setAvatarKey(aKey);
        } else if (aKey) {
            setAvatarKey(aKey);
            setUserAvatar(avatarUrlFromKey(aKey));
        }
    };

    const applyAvatar = ({ avatar_key }) => {
        setAvatarKey(avatar_key || null);
    };

    const logout = () => {
        setUserName("");
        setAvatarKey(null);
        setUserAvatar(null);
        setAccessToken(null);
        setRefreshToken(null);

        setTeam(null);
        setDriver(null);
        setSim({ season: 2026, currentRound: 0, lastResults: null, standings: null });

        localStorage.removeItem(STORAGE_USER);
        localStorage.removeItem(STORAGE_GAME);
    };

    const isAuthenticated = useMemo(() => !!accessToken, [accessToken]);

    return (
        <GameContext.Provider
            value={{
                ready,

                // User
                userName,
                setUserName,
                avatarKey,
                userAvatar,

                // Auth
                accessToken,
                refreshToken,
                setAccessToken,
                setRefreshToken,
                isAuthenticated,
                applyLogin,
                applyAvatar,
                logout,

                // Game
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

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGame must be used inside GameProvider");
    return ctx;
}