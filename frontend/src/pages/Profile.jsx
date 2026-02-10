import React from "react";
import Header from "../components/Header.jsx";
import AvatarPicker from "../components/AvatarPicker";
import { useGame } from "../context/GameContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const { userName, userAvatar, setUserAvatar, setAvatarKey, logout } = useGame();
    const nav = useNavigate();

    function onChanged(url, key) {
        setUserAvatar(url);
        if (key) setAvatarKey(key);
    }
    const fallbackAvatar = `${import.meta.env.BASE_URL}avatars/default.jpg`;
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header />

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <h1 className="text-4xl font-extrabold mb-2">Profil</h1>
                <p className="text-gray-300 mb-6">Choisis ton avatar et gère ta session.</p>

                <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5 mb-6 flex items-center gap-4">
                    <img
                        src={userAvatar || fallbackAvatar}
                        alt="avatar"
                        className="h-16 w-16 rounded-full object-cover border border-gray-700"
                        onError={(e) => (e.currentTarget.src = fallbackAvatar)}
                    />
                    <div>
                        <div className="text-xl font-bold">{userName}</div>
                        <div className="text-sm text-gray-300">Compte connecté</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-700 bg-gray-800/30 p-5">
                    <h2 className="text-lg font-bold mb-4 text-red-400">Changer d’avatar</h2>

                    <AvatarPicker onChanged={(avatarUrl, key) => onChanged(avatarUrl, key)} />
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() => nav(-1)}
                        className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 font-semibold"
                    >
                        Retour
                    </button>

                    <button
                        onClick={() => {
                            logout();
                            nav("/login");
                        }}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-bold"
                    >
                        Se déconnecter
                    </button>
                </div>
            </main>
        </div>
    );
}