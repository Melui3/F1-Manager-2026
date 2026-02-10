import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { login, apiFetch } from "../services/api";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { applyLogin } = useGame();

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

            // 1) Login -> tokens
            const tokens = await login(u, password); // { access, refresh }

            // 2) /me avec access direct (propre)
            const me = await apiFetch("/api/auth/me/", {
                headers: {
                    Authorization: `Bearer ${tokens.access}`,
                },
            });

            // 3) Push dans le context (persist automatique)
            applyLogin({ tokens, me, fallbackUsername: u });

            // 4) go
            navigate("/choose-team");
        } catch (e) {
            console.error("Login error", e);
            setError(e?.body?.detail || e?.message || "Échec de la connexion.");
        } finally {
            setLoading(false);
        }
    }

    const logoUrl = `${import.meta.env.BASE_URL}logo-f1m-2026.png`;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <img src={logoUrl} alt="F1 Manager 2026" className="h-10 w-auto object-contain" />

            <h1 className="text-4xl font-bold mt-6 mb-6">F1 Manager 2026</h1>

            <div className="bg-gray-800 p-8 rounded-2xl shadow-md w-full max-w-sm border border-gray-700">
                <h2 className="text-2xl font-bold mb-4">Connexion</h2>

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
                        autoComplete="current-password"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-bold transition disabled:opacity-50"
                    >
                        {loading ? "Connexion..." : "Se connecter"}
                    </button>
                </form>

                <div className="mt-4 text-sm text-gray-300">
                    Pas de compte ?{" "}
                    <Link to="/register" className="text-red-400 hover:text-red-300 font-semibold">
                        Créer un compte
                    </Link>
                </div>
            </div>
        </div>
    );
}