import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

export default function Header({ title = "F1 Manager 2026", logoSrc = "/logo-f1m-2026.png" }) {
    const { userName, userAvatar, logout } = useGame();
    const [open, setOpen] = useState(false);
    const nav = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        function onDoc(e) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <header className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md">
            <div className="flex items-center space-x-2">
                <img src={logoSrc} alt={title} className="h-10 w-10 object-contain" />
                <h1 className="text-xl font-bold">{title}</h1>
            </div>

            <div className="relative" ref={ref}>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-800 border border-gray-800"
                >
                    <span className="font-semibold">{userName || "Profil"}</span>
                    <img
                        src={userAvatar || "/avatars/default.png"}
                        alt="User Avatar"
                        className="h-9 w-9 rounded-full object-cover border border-gray-700"
                        onError={(e) => (e.currentTarget.src = "/avatars/default.png")}
                    />
                </button>

                {open && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-gray-700 bg-gray-900 shadow-xl overflow-hidden">
                        <button
                            className="w-full text-left px-4 py-3 hover:bg-gray-800 text-sm"
                            onClick={() => {
                                setOpen(false);
                                nav("/profile");
                            }}
                        >
                            Profil & avatar
                        </button>

                        <button
                            className="w-full text-left px-4 py-3 hover:bg-gray-800 text-sm text-red-300"
                            onClick={() => {
                                setOpen(false);
                                logout();
                                nav("/login");
                            }}
                        >
                            Se déconnecter
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}