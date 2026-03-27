import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";
import Button from "../components/ui/Button";
import Input, { Select } from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";

const AVATARS = [
    "verstappen","leclerc","norris","hamilton","alonso","sainz","colapinto","stroll",
    "hadjar","albon","antonelli","piastri","bearman","hulkenberg","bortoleto","ocon",
    "lawson","russell",
];

export default function RegisterScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [avatarKey, setAvatarKey] = useState("verstappen");

    const [msg, setMsg] = useState(null); // { type, text }
    const [loading, setLoading] = useState(false);

    const { applyLogin } = useGame();
    const navigate = useNavigate();

    const base = import.meta.env.BASE_URL || "/";
    const logoUrl = `${base}logo-f1m-2026.png`;
    const avatarSrc = useMemo(() => (avatarKey ? `${base}avatars/${avatarKey}.jpg` : null), [avatarKey, base]);

    // reset message quand l'user retape
    useEffect(() => {
        if (msg?.type === "success") return;
        setMsg(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, password, avatarKey]);

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
            setMsg({ type: "info", text: "Création du compte…" });

            const res = await apiFetch("/api/auth/register/", {
                method: "POST",
                body: JSON.stringify({ username: u, password, avatar_key: avatarKey }),
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

            setMsg({ type: "success", text: "Compte créé. Redirection…" });
            setTimeout(() => navigate("/choose-team"), 250);
        } catch (e) {
            console.error("Register error", e);
            const text = e?.body?.detail || e?.message || "Échec de la création de compte.";
            setMsg({ type: "error", text });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-f1-dark px-4">

            {/* Logo + titre */}
            <div className="flex flex-col items-center mb-8 f1-fade-in">
                <img src={logoUrl} alt="F1 Manager 2026" className="h-12 w-auto object-contain mb-4" />
                <h1 className="font-f1-display text-3xl font-bold tracking-tight">
                    F1 MANAGER <span className="text-f1-red">2026</span>
                </h1>
            </div>

            {/* Carte */}
            <Card stripe className="w-full max-w-sm p-8 f1-fade-in">
                <h2 className="font-f1-display text-base font-bold tracking-widest text-f1-silver uppercase mb-6">
                    Créer un compte
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
                        autoComplete="new-password"
                    />

                    {/* Avatar */}
                    <div className="rounded-xl border border-f1-border bg-f1-surface-2/40 p-3">
                        <span className="f1-label">Avatar</span>
                        <div className="flex items-center gap-3 mt-1">
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt="Avatar"
                                    className="h-14 w-14 rounded-full object-cover border-2 border-f1-border shrink-0"
                                />
                            ) : (
                                <div className="h-14 w-14 rounded-full border-2 border-f1-border bg-f1-surface shrink-0" />
                            )}

                            <div className="flex-1 flex flex-col gap-1.5">
                                <Select
                                    value={avatarKey}
                                    disabled={loading}
                                    onChange={(e) => setAvatarKey(e.target.value)}
                                >
                                    {AVATARS.map((k) => (
                                        <option key={k} value={k}>
                                            {k.charAt(0).toUpperCase() + k.slice(1)}
                                        </option>
                                    ))}
                                </Select>
                                <p className="text-[11px] text-f1-muted">
                                    Modifiable depuis le profil.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" loading={loading} fullWidth className="mt-2">
                        {loading ? "Création…" : "Créer le compte"}
                    </Button>
                </form>

                <div className="f1-divider" />

                <p className="text-sm text-f1-silver">
                    Déjà un compte ?{" "}
                    <Link
                        to="/login"
                        className="text-f1-red hover:text-f1-red-light font-semibold transition-colors"
                    >
                        Se connecter
                    </Link>
                </p>
            </Card>
        </div>
    );
}
