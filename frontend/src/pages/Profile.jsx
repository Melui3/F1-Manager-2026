import { useEffect, useState } from "react";
import AvatarPicker from "../components/AvatarPicker.jsx";
import { useGame } from "../context/GameContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { TEAM_COLOR, COUNTRY_FLAG } from "../data/labels";
import { apiFetch } from "../services/api";

// ─── Stat bar ─────────────────────────────────────────────────────────────────

function StatBar({ label, value, max = 100 }) {
    const pct = Math.round(((value ?? 0) / max) * 100);
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-f1-muted uppercase tracking-wider">{label}</span>
                <span className="font-f1-display font-bold text-f1-white">{value ?? "—"}</span>
            </div>
            <div className="h-1.5 rounded-full bg-f1-dark/60 border border-f1-border overflow-hidden">
                <div
                    className="h-full rounded-full bg-f1-red transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── Training upgrades ────────────────────────────────────────────────────────

const UPGRADES = [
    { stat: "speed",       label: "Vitesse",     desc: "+2 Speed",       cost: 5_000_000, icon: "🏎️" },
    { stat: "racing",      label: "Course",      desc: "+2 Racing",      cost: 5_000_000, icon: "🎯" },
    { stat: "reaction",    label: "Réflexes",    desc: "+2 Reaction",    cost: 5_000_000, icon: "⚡" },
    { stat: "consistency", label: "Régularité",  desc: "+2 Consistency", cost: 3_000_000, icon: "📊" },
    { stat: "experience",  label: "Expérience",  desc: "+2 Experience",  cost: 3_000_000, icon: "🧠" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
    const { userName, userAvatar, setUserAvatar, setAvatarKey, logout, driver, setDriver, team } = useGame();
    const nav = useNavigate();

    const [budget, setBudget] = useState(null);
    const [training, setTraining] = useState(null);

    useEffect(() => {
        apiFetch("/api/season/budget/").then((res) => setBudget(res?.budget ?? 0)).catch(() => setBudget(0));
    }, []);

    const handleTrain = async (stat) => {
        if (!driver?.id || budget == null) return;
        setTraining({ loading: stat, error: null });
        try {
            const res = await apiFetch("/api/season/train/", {
                method: "POST",
                body: JSON.stringify({ driver_id: driver.id, stat }),
            });
            setBudget(res.budget);
            setDriver({ ...driver, ...res.driver });
        } catch (e) {
            setTraining({ loading: null, error: e?.message || "Erreur entraînement" });
        } finally {
            setTraining((t) => ({ ...t, loading: null }));
        }
    };

    function onChanged(url, key) {
        setUserAvatar(url);
        if (key) setAvatarKey(key);
    }

    const initials = (userName || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    const teamColor = TEAM_COLOR[team?.name];

    return (
        <div className="p-5 md:p-8 max-w-4xl mx-auto w-full f1-fade-in">
            <div className="mb-6">
                <h1 className="font-f1-display text-3xl font-bold">
                    MON <span className="text-f1-red">ÉQUIPE</span>
                </h1>
                <p className="text-f1-silver text-sm mt-1">Gère ton profil et consulte tes stats.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
                {/* Identité */}
                <Card stripe className="p-5 flex items-center gap-4">
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt="avatar"
                            className="h-16 w-16 rounded-full object-cover border-2 border-f1-border shrink-0"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-full border-2 border-f1-border bg-f1-surface-2 flex items-center justify-center text-xl font-black text-f1-silver shrink-0">
                            {initials || "?"}
                        </div>
                    )}

                    <div>
                        <div className="font-f1-display text-lg font-bold">{userName}</div>
                        <div className="text-xs text-f1-muted mt-0.5 uppercase tracking-wider">Manager</div>
                    </div>
                </Card>

                {/* Team */}
                {team && (
                    <div className={`bg-f1-surface border-2 rounded-2xl p-5 ${teamColor?.border ?? "border-f1-border"}`}>
                        <div className="f1-label mb-3">Écurie</div>
                        <div className={`font-f1-display font-bold text-base ${teamColor?.text ?? "text-f1-white"}`}>
                            {team.name}
                        </div>
                        {team.country && (
                            <div className="text-f1-silver text-sm mt-1">
                                {COUNTRY_FLAG[team.country] ?? ""} {team.country}
                            </div>
                        )}
                    </div>
                )}

                {/* Pilote */}
                {driver && (
                    <Card className="p-5 md:col-span-2">
                        <div className="f1-label mb-4">Pilote choisi</div>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <div className="shrink-0 flex flex-col items-center gap-2">
                                <div className="font-f1-display text-4xl font-black text-f1-red">#{driver.number}</div>
                                <div className="font-bold text-f1-white text-sm">
                                    {driver.name} <span className="uppercase">{driver.surname}</span>
                                </div>
                                {driver.country && (
                                    <div className="text-base">{COUNTRY_FLAG[driver.country] ?? ""}</div>
                                )}
                            </div>

                            <div className="flex-1 grid grid-cols-1 gap-2">
                                <StatBar label="Speed"       value={driver.speed} />
                                <StatBar label="Racing"      value={driver.racing} />
                                <StatBar label="Reaction"    value={driver.reaction} />
                                <StatBar label="Experience"  value={driver.experience} />
                                <StatBar label="Consistency" value={driver.consistency} />
                                <StatBar label="Wet"         value={driver.wet_circuit_affinity} />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Entraînement */}
                {driver && budget != null && (
                    <Card className="p-5 md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase">
                                Entraînement
                            </h2>
                            <div className="font-f1-display font-bold text-f1-yellow">
                                {(budget / 1_000_000).toFixed(0)}M budget
                            </div>
                        </div>

                        {training?.error && <div className="text-red-400 text-sm mb-3">{training.error}</div>}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {UPGRADES.map(({ stat, label, desc, cost, icon }) => {
                                const canAfford = budget >= cost;
                                const currentVal = driver[stat];
                                return (
                                    <button
                                        key={stat}
                                        onClick={() => handleTrain(stat)}
                                        disabled={!canAfford || training?.loading === stat}
                                        className={[
                                            "flex flex-col items-center gap-2 p-3 rounded-xl border text-sm transition-all",
                                            canAfford
                                                ? "border-f1-border bg-f1-dark/40 hover:border-f1-red/40 hover:bg-f1-red/5 cursor-pointer"
                                                : "border-f1-border/30 bg-f1-dark/20 opacity-40 cursor-not-allowed",
                                        ].join(" ")}
                                    >
                                        <span className="text-2xl">{icon}</span>
                                        <span className="font-f1-display font-bold text-f1-white text-sm">{label}</span>
                                        <span className="text-f1-muted text-xs">{desc}</span>
                                        <span className="text-[10px] font-bold text-f1-yellow">{cost / 1_000_000}M</span>
                                        {currentVal != null && (
                                            <span className="font-f1-display text-xs text-f1-silver">Val: {currentVal}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Avatar */}
                <Card className="p-5 md:col-span-2">
                    <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase mb-4">
                        Changer d'avatar
                    </h2>
                    <AvatarPicker onChanged={onChanged} />
                </Card>
            </div>

            <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => nav(-1)}>
                    Retour
                </Button>

                <Button
                    variant="danger"
                    onClick={() => {
                        logout();
                        nav("/login");
                    }}
                >
                    Se déconnecter
                </Button>
            </div>
        </div>
    );
}
