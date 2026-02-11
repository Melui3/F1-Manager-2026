import React, { useMemo, useState, useEffect } from "react";
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
    const [msg, setMsg] = useState(null); // { type, text }
    const [loading, setLoading] = useState(false);

    const { applyLogin } = useGame();
    const navigate = useNavigate();

    const base = import.meta.env.BASE_URL || "/";
    const logoUrl = `${base}logo-f1m-2026.png`;

    const avatarSrc = useMemo(() => (avatarKey ? `${base}avatars/${avatarKey}.jpg` : null), [avatarKey, base]);

    // optionnel : reset message quand l'user retape
    useEffect(() => {
        if (msg?.type === "success") return;
        setMsg(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, password, avatarKey]);

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
            setMsg({ type: "info", text: "Création du compte..." });

            const res = await apiFetch("/api/auth/register/", {
                method: "POST",
                body: JSON.stringify({
                    username: u,
                    password,
                    avatar_key: avatarKey,
                }),
            });

            applyLogin({
                tokens: { access: res?.access, refresh: res?.refresh },
                me: {
                    username: res?.username || u,
                    avatar_key: res?.avatar_key || avatarKey,
                    avatar_url: res?.avatar_url || null,
                },
                fallbackUsername: u,
            });

            setMsg({ type: "success", text: "Compte créé. Redirection..." });
            setTimeout(() => navigate("/choose-team"), 250);
        } catch (e) {
            console.error("Register error", e);
            const text = e?.body?.detail || e?.message || "Échec de la création de compte.";
            setError(text);
            setMsg({ type: "error", text });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <img src={logoUrl} alt="F1 Manager 2026" className="h-10 w-auto object-contain" />
            <h1 className="text-4xl font-bold mt-6 mb-6">Créer un compte</h1>

            <div className={`bg-gray-800 p-8 rounded-2xl shadow-md w-full max-w-sm border border-gray-700 ${loading ? "animate-pulse" : ""}`}>
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
                        className="px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-60"
                        autoComplete="username"
                    />

                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        disabled={loading}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-60"
                        autoComplete="new-password"
                    />

                    <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-3">
                        <div className="text-xs text-gray-400 mb-2">Choisis ton avatar</div>

                        <div className="flex items-center gap-3">
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt="Avatar"
                                    className="h-14 w-14 rounded-full object-cover border border-gray-700"
                                />
                            ) : (
                                <div className="h-14 w-14 rounded-full border border-gray-700 bg-gray-800" />
                            )}

                            <div className="flex-1 flex flex-col gap-2">
                                <select
                                    value={avatarKey}
                                    disabled={loading}
                                    onChange={(e) => setAvatarKey(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-60"
                                >
                                    {AVATARS.map((k) => (
                                        <option key={k} value={k}>
                                            {k}
                                        </option>
                                    ))}
                                </select>

                                <div className="text-[11px] text-gray-400">
                                    Tu pourras changer plus tard (si on ajoute l’écran profil).
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                        )}
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