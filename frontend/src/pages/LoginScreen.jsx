import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { login } from "../services/api";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null); // { type: "success"|"info"|"error", text: string } | null
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { applyLogin } = useGame();

    // optionnel : reset message quand l'user retape
    useEffect(() => {
        if (msg?.type === "success") return;
        setMsg(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, password]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;

        setError(null);
        setMsg(null);

        const u = username.trim();
        if (!u || !password) {
            setError("Veuillez entrer un nom d'utilisateur et un mot de passe.");
            return;
        }

        try {
            setLoading(true);
            setMsg({ type: "info", text: "Connexion en cours..." });

            const res = await login(u, password);
            // res = { access, refresh, username, avatar_key, avatar_url }

            applyLogin({
                tokens: { access: res.access, refresh: res.refresh },
                me: {
                    username: res.username || u,
                    avatar_key: res.avatar_key || null,
                    avatar_url: res.avatar_url || null,
                },
                fallbackUsername: u,
            });

            setMsg({ type: "success", text: "Connexion OK. Redirection..." });

            // micro délai pour que l’UI montre le succès (sinon ça “clignote”)
            setTimeout(() => navigate("/choose-team"), 250);
        } catch (e) {
            console.error("Login error", e);
            const text = e?.body?.detail || e?.message || "Échec de la connexion.";
            setError(text);
            setMsg({ type: "error", text });
        } finally {
            setLoading(false);
        }
    }

    const base = import.meta.env.BASE_URL || "/";
    const logoUrl = `${base}logo-f1m-2026.png`;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <img src={logoUrl} alt="F1 Manager 2026" className="h-10 w-auto object-contain" />
            <h1 className="text-4xl font-bold mt-6 mb-6">F1 Manager 2026</h1>

            <div className={`bg-gray-800 p-8 rounded-2xl shadow-md w-full max-w-sm border border-gray-700 ${loading ? "animate-pulse" : ""}`}>
                <h2 className="text-2xl font-bold mb-4">Connexion</h2>

                {(msg || error) && (
                    <div
                        className={`mb-4 p-3 text-sm rounded-xl border font-semibold ${
                            msg?.type === "success"
                                ? "border-green-500/30 bg-green-500/10 text-green-200"
                                : msg?.type === "info"
                                    ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
                                    : "border-red-500/30 bg-red-500/10 text-red-200"
                        }`}
                    >
                        {msg?.text || error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        disabled={loading}
                        onChange={(e) => setUsername(e.target.value)}
                        className="px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-60"
                        autoComplete="username"
                    />

                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        disabled={loading}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-60"
                        autoComplete="current-password"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                        )}
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