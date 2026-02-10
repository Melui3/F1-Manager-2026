import React from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

export default function Header({ userName: userNameProp, userAvatar: userAvatarProp }) {
    const nav = useNavigate();
    const { userName: userNameCtx, userAvatar: userAvatarCtx } = useGame();

    const base = import.meta.env.BASE_URL; // ex: "/F1-Manager-2026/"
    const userName = userNameProp ?? userNameCtx ?? "";

    // Logo GH Pages safe
    const logoUrl = `${base}logo-f1m-2026.png`;

    // Avatar : NO fallback image. If missing => show placeholder.
    const rawAvatar = userAvatarProp ?? userAvatarCtx ?? null;

    const avatarSrc = rawAvatar
        ? (String(rawAvatar).startsWith("http")
            ? String(rawAvatar)
            : `${base}${String(rawAvatar).replace(/^\//, "")}`)
        : null;

    // Placeholder (no-image)
    const initials = (userName || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    return (
        <header className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md">
            <div className="flex items-center gap-3">
                <img src={logoUrl} alt="F1 Manager 2026" className="h-10 w-auto object-contain" />
                <h1 className="text-xl font-bold">F1 Manager 2026</h1>
            </div>

            <button
                type="button"
                onClick={() => nav("/profile")}
                className="flex items-center gap-2 hover:opacity-90"
                title="Ouvrir le profil"
            >
                <span className="text-sm font-semibold">{userName}</span>

                {avatarSrc ? (
                    <img
                        src={avatarSrc}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full object-cover border border-gray-700"
                        // If avatar URL is broken: just hide it and keep placeholder next renders
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <div className="h-8 w-8 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center text-xs font-black">
                        {initials || "?"}
                    </div>
                )}
            </button>
        </header>
    );
}