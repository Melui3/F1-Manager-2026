import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";

const AVATARS = [
    "verstappen","leclerc","norris","hamilton","alonso","sainz","colapinto","stroll",
    "hadjar","albon","antonelli","piastri","bearman","hulkenberg","bortoleto","ocon",
    "lawson","russell",
];

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [avatarKey, setAvatarKey] = useState("verstappen");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { applyLogin } = useGame();
    const navigate = useNavigate();

    const base = import.meta.env.BASE_URL || "/";
    const logoUrl = `${base}logo-f1m-2026.png`;

    const avatarSrc = useMemo(() => {
        return avatarKey ? `${base}avatars/${avatarKey}.jpg` : null;
    }, [avatarKey, base]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        const u = username.trim();
        if (!u || !password) {
            setError("Veuillez entrer un nom d'utilisateur et un mot de passe.");
            return;
        }

        try {
            setLoading(true);

            // ✅ register backend: POST /api/auth/register/
            const res = await apiFetch("/api/auth/register/", {
                method: "POST",
                body: JSON.stringify({
                    username: u,
                    password,
                    avatar_key: avatarKey,
                }),
            });

            // res peut être { access, refresh, username, avatar_key, avatar_url }
            // ou juste { access, refresh } selon ton backend actuel.
            applyLogin({
                tokens: { access: res?.access, refresh: res?.refresh },
                me: {
                    username: res?.username || u,
                    avatar_key: res?.avatar_key || avatarKey,
                    avatar_url: res?.avatar_url || null,
                },
                fallbackUsername: u,
            });

            navigate("/choose-team");
        } catch (e) {
            console.error("Register error", e);
            setError(e?.body?.detail || e?.message || "Échec de la création de compte.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <img src={logoUrl} alt="F1 Manager 2026" className="h-10 w-auto object-contain" />
            <h1 className="text-4xl font-bold mt-6 mb-6">Créer un compte</h1>

            <div className="bg-gray-800 p-8 rounded-2xl shadow-md w-full max-w-sm border border-gray-700">
                {error && (
                    <div className="mb-4 p-3 text-sm rounded bg-red-900/40 border border-red-700 text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500"
                        autoComplete="username"
                    />

                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500"
                        autoComplete="new-password"
                    />

                    <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-3">
                        <div className="text-xs text-gray-400 mb-2">Choisis ton avatar</div>

                        <div className="flex items-center gap-3 mb-3">
                            {avatarSrc && (
                                <img
                                    src={avatarSrc}
                                    alt="Avatar"
                                    className="h-12 w-12 rounded-full object-cover border border-gray-700"
                                />
                            )}
                            <select
                                value={avatarKey}
                                onChange={(e) => setAvatarKey(e.target.value)}
                                className="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500"
                            >
                                {AVATARS.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="text-[11px] text-gray-400">
                            (Si tu veux une grille comme AvatarPicker, je te la mets aussi, mais là on fait simple et efficace.)
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-bold transition disabled:opacity-50"
                    >
                        {loading ? "Création..." : "Créer le compte"}
                    </button>
                </form>

                <div className="mt-4 text-sm text-gray-300">
                    Déjà un compte ?{" "}
                    <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold">
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
}