// src/context/GameContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const GameContext = createContext(null);
const STORAGE_KEY = "f1m26_game";

const base = import.meta.env.BASE_URL; // ex: "/F1-Manager-2026/"

// Helper: build a GH Pages-safe asset URL from an avatar key
function avatarUrlFromKey(key) {
    if (!key) return null;
    // Adapte l'extension si tes fichiers sont en .png
    return `${base}avatars/${key}.jpg`;
}

// Helper: normalize backend urls:
// - if url is absolute (http/https) keep it
// - if url is "/avatars/x.jpg" convert to BASE_URL + "avatars/x.jpg"
function normalizeUrl(url) {
    if (!url) return null;
    const s = String(url);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `${base}${s.replace(/^\//, "")}`;
}

export function GameProvider({ children }) {
    const [ready, setReady] = useState(false);

    // Profile
    const [userName, setUserName] = useState("");
    const [avatarKey, setAvatarKey] = useState(null);     // <- plus "default"
    const [userAvatar, setUserAvatar] = useState(null);   // <- plus default.jpg

    // Game
    const [team, setTeam] = useState(null);
    const [driver, setDriver] = useState(null);

    // Auth
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);

    // Load from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const p = JSON.parse(raw);

                setUserName(p.userName || "");
                setAvatarKey(p.avatarKey || null);
                setUserAvatar(p.userAvatar || null);

                setTeam(p.team || null);
                setDriver(p.driver || null);

                setAccessToken(p.accessToken || null);
                setRefreshToken(p.refreshToken || null);
            }
        } catch (e) {
            console.warn("GameContext load failed", e);
        } finally {
            setReady(true);
        }
    }, []);

    // Persist to localStorage
    useEffect(() => {
        if (!ready) return;
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                userName,
                avatarKey,
                userAvatar,
                team,
                driver,
                accessToken,
                refreshToken,
            })
        );
    }, [ready, userName, avatarKey, userAvatar, team, driver, accessToken, refreshToken]);

    // Called after successful login
    // Expecting something like: { userName, access, refresh, avatar_key, avatar_url }
    const login = ({ userName, access, refresh, avatar_key, avatar_url }) => {
        setUserName(userName || "");
        setAccessToken(access || null);
        setRefreshToken(refresh || null);

        // Priority: avatar_url if provided, else avatar_key, else null
        if (avatar_url) {
            setUserAvatar(normalizeUrl(avatar_url));
            setAvatarKey(avatar_key || null);
            return;
        }

        if (avatar_key) {
            setAvatarKey(avatar_key);
            setUserAvatar(avatarUrlFromKey(avatar_key));
            return;
        }

        setAvatarKey(null);
        setUserAvatar(null);
    };

    const logout = () => {
        setUserName("");
        setAvatarKey(null);
        setUserAvatar(null);
        setTeam(null);
        setDriver(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <GameContext.Provider
            value={{
                ready,

                // Profile
                userName,
                setUserName,
                avatarKey,
                setAvatarKey,
                userAvatar,
                setUserAvatar,

                // Game
                team,
                setTeam,
                driver,
                setDriver,

                // Auth
                accessToken,
                refreshToken,
                setAccessToken,
                setRefreshToken,
                login,
                logout,
                isAuthenticated: !!accessToken,
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