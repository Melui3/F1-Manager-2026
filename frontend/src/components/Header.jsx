import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

export default function Header({ userName: userNameProp }) {
    const nav = useNavigate();
    const { userName: userNameCtx, avatarKey } = useGame();

    const base = import.meta.env.BASE_URL || "/";
    const userName = userNameProp ?? userNameCtx ?? "";
    const logoUrl = `${base}logo-f1m-2026.png`;

    const src = avatarKey ? `${base}avatars/${avatarKey}.jpg` : null;
    const [ok, setOk] = useState(true);
    useEffect(() => setOk(true), [avatarKey]);

    return (
        <header className="flex items-center justify-between px-5 py-3 bg-f1-dark border-b border-f1-border text-f1-white shadow-md">
            <div className="flex items-center gap-3">
                <img src={logoUrl} alt="F1 Manager 2026" className="h-9 w-auto object-contain" />
                <span className="font-f1-display text-base font-bold tracking-wide hidden sm:block">
                    F1 MANAGER <span className="text-f1-red">2026</span>
                </span>
            </div>

            <button
                type="button"
                onClick={() => nav("/profile")}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                title="Ouvrir le profil"
            >
                <span className="text-sm font-semibold text-f1-white">{userName}</span>

                {src && ok ? (
                    <img
                        src={src}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full object-cover border-2 border-f1-border"
                        onError={() => setOk(false)}
                    />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-f1-surface-2 border-2 border-f1-border flex items-center justify-center text-xs font-bold text-f1-silver">
                        {userName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                )}
            </button>
        </header>
    );
}
