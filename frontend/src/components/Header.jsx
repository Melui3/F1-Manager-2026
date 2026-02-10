import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

export default function Header({ userName: userNameProp }) {
    const nav = useNavigate();
    const { userName: userNameCtx, avatarKey } = useGame();

    const base = import.meta.env.BASE_URL || "/";
    const userName = userNameProp ?? userNameCtx ?? "";
    const logoUrl = `${base}logo-f1m-2026.png`;

    // avatar = clé -> url reconstruite propre
    const src = avatarKey ? `${base}avatars/${avatarKey}.jpg` : null;

    // si l’image est cassée, on n’affiche rien
    const [ok, setOk] = useState(true);

    // reset ok quand la clé change
    useEffect(() => setOk(true), [avatarKey]);

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

                {src && ok && (
                    <img
                        src={src}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full object-cover border border-gray-700"
                        onError={() => setOk(false)}
                    />
                )}
            </button>
        </header>
    );
}