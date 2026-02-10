// src/components/Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";


export default function Header({ userName: userNameProp, userAvatar: userAvatarProp }) {
    const nav = useNavigate();
    const { userName: userNameCtx, userAvatar: userAvatarCtx } = useGame();

    const userName = userNameProp ?? userNameCtx ?? "";
    const userAvatar = userAvatarProp ?? userAvatarCtx ?? "/avatars/default.jpg";
    const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}logo-f1m-2026.png`;

    return (
        <header className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md">
            <div className="flex items-center gap-3">

                <p className="text-xs text-gray-400">{logoUrl}</p>
                <img src={logoUrl} alt="F1 Manager 2026"/>
                <h1 className="text-xl font-bold">F1 Manager 2026</h1>
            </div>

            <button
                type="button"
                onClick={() => nav("/profile")}
                className="flex items-center gap-2 hover:opacity-90"
                title="Ouvrir le profil"
            >
                <span className="text-sm font-semibold">{userName}</span>
                <img
                    src={userAvatar}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover border border-gray-700"
                    onError={(e) => (e.currentTarget.src = "/avatars/default.jpg")}
                />
            </button>
        </header>
    );
}