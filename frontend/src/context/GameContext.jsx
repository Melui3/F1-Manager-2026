// src/context/GameContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const GameContext = createContext(null);
const STORAGE_KEY = "f1m26_game";

export function GameProvider({ children }) {
    const [ready, setReady] = useState(false);

    // Profile
    const [userName, setUserName] = useState("");
    const [avatarKey, setAvatarKey] = useState("default");
    const [userAvatar, setUserAvatar] = useState("/avatars/default.jpg");

    // Game
    const [team, setTeam] = useState(null);
    const [driver, setDriver] = useState(null);

    // Auth (si tu veux garder ici)
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);

    // Load
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const p = JSON.parse(raw);

                setUserName(p.userName || "");
                setAvatarKey(p.avatarKey || "default");
                setUserAvatar(p.userAvatar || "/avatars/default.jpg");

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

    // Persist
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

    const login = ({ userName, access, refresh, avatar_key, avatar_url }) => {
        setUserName(userName || "");
        setAccessToken(access || null);
        setRefreshToken(refresh || null);

        if (avatar_key) {
            setAvatarKey(avatar_key);
            setUserAvatar(`/avatars/${avatar_key}.jpg`);
        } else if (avatar_url) {
            setUserAvatar(avatar_url);
        }
    };

    const logout = () => {
        setUserName("");
        setAvatarKey("default");
        setUserAvatar("/avatars/default.jpg");
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