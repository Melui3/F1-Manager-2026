import AvatarPicker from "../components/AvatarPicker.jsx";
import { useGame } from "../context/GameContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { TEAM_COLOR, COUNTRY_FLAG } from "../data/labels";

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
    const { userName, userAvatar, setUserAvatar, setAvatarKey, logout, driver, team } = useGame();
    const nav = useNavigate();

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
