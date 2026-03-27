import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { login } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [msg, setMsg] = useState(null); // { type: "success"|"info"|"error", text: string } | null
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { applyLogin } = useGame();

    // reset message quand l'user retape
    useEffect(() => {
        if (msg?.type === "success") return;
        setMsg(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, password]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;

        setMsg(null);

        const u = username.trim();
        if (!u || !password) {
            setMsg({ type: "error", text: "Veuillez entrer un nom d'utilisateur et un mot de passe." });
            return;
        }

        try {
            setLoading(true);
            setMsg({ type: "info", text: "Connexion en cours…" });

            const res = await login(u, password);

            applyLogin({
                tokens: { access: res.access, refresh: res.refresh },
                me: {
                    username: res.username || u,
                    avatar_key: res.avatar_key || null,
                    avatar_url: res.avatar_url || null,
                },
                fallbackUsername: u,
            });

            setMsg({ type: "success", text: "Connexion OK. Redirection…" });
            setTimeout(() => navigate("/choose-team"), 250);
        } catch (e) {
            console.error("Login error", e);
            const text = e?.body?.detail || e?.message || "Échec de la connexion.";
            setMsg({ type: "error", text });
        } finally {
            setLoading(false);
        }
    }

    const base = import.meta.env.BASE_URL || "/";
    const logoUrl = `${base}logo-f1m-2026.png`;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-f1-dark px-4">

            {/* Logo + titre */}
            <div className="flex flex-col items-center mb-8 f1-fade-in">
                <img src={logoUrl} alt="F1 Manager 2026" className="h-12 w-auto object-contain mb-4" />
                <h1 className="font-f1-display text-3xl font-bold tracking-tight">
                    F1 MANAGER <span className="text-f1-red">2026</span>
                </h1>
            </div>

            {/* Carte de connexion */}
            <Card stripe className="w-full max-w-sm p-8 f1-fade-in">
                <h2 className="font-f1-display text-base font-bold tracking-widest text-f1-silver uppercase mb-6">
                    Connexion
                </h2>

                {msg && (
                    <Alert type={msg.type} className="mb-5">
                        {msg.text}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Nom d'utilisateur"
                        type="text"
                        placeholder="username"
                        value={username}
                        disabled={loading}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />

                    <Input
                        label="Mot de passe"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        disabled={loading}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />

                    <Button type="submit" loading={loading} fullWidth className="mt-2">
                        {loading ? "Connexion…" : "Se connecter"}
                    </Button>
                </form>

                <div className="f1-divider" />

                <p className="text-sm text-f1-silver">
                    Pas de compte ?{" "}
                    <Link
                        to="/register"
                        className="text-f1-red hover:text-f1-red-light font-semibold transition-colors"
                    >
                        Créer un compte
                    </Link>
                </p>
            </Card>
        </div>
    );
}
