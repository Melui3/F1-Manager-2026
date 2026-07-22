import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Gauge,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    Users,
    Zap,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import DriverCard from "../components/DriverCard";
import FlagBadge from "../components/ui/FlagBadge";
import { apiFetch } from "../services/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const norm = (s) => String(s ?? "").trim().toLowerCase();

const PRIORITIES = [
    {
        key: "balanced",
        label: "Équilibre",
        hint: "Profil complet",
        icon: Gauge,
    },
    {
        key: "qualif",
        label: "Qualif",
        hint: "Vitesse pure",
        icon: Zap,
    },
    {
        key: "race",
        label: "Course",
        hint: "Rythme long",
        icon: Trophy,
    },
    {
        key: "safe",
        label: "Fiabilité",
        hint: "Moins d'erreurs",
        icon: ShieldCheck,
    },
];

function getTeamName(team) {
    if (!team) return "Écurie";
    if (typeof team === "object") return team.name ?? "Écurie";
    return String(team);
}

function toNumber(value, fallback = 0) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}

function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, Math.round(value)));
}

function stat10(value) {
    return clamp(toNumber(value) * 10);
}

function driverProfile(driver) {
    const speed = stat10(driver?.speed);
    const racing = stat10(driver?.racing);
    const reaction = stat10(driver?.reaction);
    const experience = stat10(driver?.experience);
    const consistency = clamp(toNumber(driver?.consistency));
    const errorControl = clamp((10 - toNumber(driver?.error_rate, 6)) * 10);
    const wet = stat10(driver?.wet_circuit_affinity);

    const qualif = clamp(speed * 0.62 + reaction * 0.38);
    const race = clamp(racing * 0.46 + consistency * 0.34 + experience * 0.2);
    const control = clamp(consistency * 0.68 + errorControl * 0.32);
    const rating = clamp(qualif * 0.28 + race * 0.36 + control * 0.25 + wet * 0.11);

    let archetype = "Équilibré";
    if (control >= 86) archetype = "Sûr";
    if (qualif >= race + 8) archetype = "Explosif";
    if (race >= qualif + 8) archetype = "Endurant";
    if (rating >= 88) archetype = "Leader";

    return { qualif, race, control, wet, rating, archetype };
}

function priorityScore(driver, priority) {
    const profile = driver?._profile ?? driverProfile(driver);
    if (priority === "qualif") return profile.qualif * 1.2 + profile.rating * 0.15;
    if (priority === "race") return profile.race * 1.2 + profile.control * 0.2;
    if (priority === "safe") return profile.control * 1.2 + profile.race * 0.2;
    return profile.rating;
}

function sameDriver(a, b) {
    if (!a || !b) return false;
    return String(a.number) === String(b.number) && norm(a.surname) === norm(b.surname);
}

function PriorityButton({ option, active, onClick }) {
    const Icon = option.icon;

    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={[
                "rounded-xl border p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red/70",
                active
                    ? "border-f1-red/70 bg-f1-red/10 text-f1-white shadow-lg shadow-f1-red/10"
                    : "border-f1-border bg-f1-dark/45 text-f1-silver hover:border-f1-muted hover:bg-f1-surface-2/55",
            ].join(" ")}
        >
            <div className="flex items-center gap-2">
                <Icon className={active ? "text-f1-red" : "text-f1-muted"} size={17} aria-hidden="true" />
                <span className="font-semibold">{option.label}</span>
            </div>
            <div className="mt-1 text-xs text-f1-muted">{option.hint}</div>
        </button>
    );
}

function Meter({ label, value, detail }) {
    const safeValue = clamp(value);

    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-f1-silver">{label}</span>
                <span className="font-f1-display text-f1-white">{safeValue}</span>
            </div>
            <div className="h-2 rounded-full bg-f1-dark/80 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-f1-red via-f1-yellow to-f1-teal"
                    style={{ width: `${safeValue}%` }}
                />
            </div>
            {detail && <div className="mt-1 text-xs text-f1-muted">{detail}</div>}
        </div>
    );
}

function InsightTile({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl border border-f1-border bg-f1-dark/45 p-3">
            <div className="flex items-center gap-2 text-xs text-f1-muted">
                <Icon size={15} aria-hidden="true" />
                {label}
            </div>
            <div className="mt-1 font-f1-display text-lg font-black text-f1-white leading-none">
                {value}
            </div>
        </div>
    );
}

export default function ChooseDriver() {
    const { team, setDriver } = useGame();
    const [selectedDriver, setSelectedDriverLocal] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [priority, setPriority] = useState("balanced");

    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const driversJson = await apiFetch("/api/drivers/");
                setDrivers(Array.isArray(driversJson) ? driversJson : []);
            } catch (err) {
                console.error("Erreur lors du chargement des pilotes:", err);
                setDrivers([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (!team) navigate("/choose-team", { replace: true });
    }, [team, navigate]);

    const teamDrivers = useMemo(() => {
        if (!team || !Array.isArray(drivers)) return [];

        const teamId = team?.id;
        const teamNameKey = norm(getTeamName(team));

        return drivers.filter((d) => {
            const t = d.team;
            if (t && typeof t === "object") {
                if (t.id != null && teamId != null) return t.id === teamId;
                if (t.name) return norm(t.name) === teamNameKey;
            }
            if (typeof t === "string") return norm(t) === teamNameKey;
            if (typeof t === "number") return teamId != null && t === teamId;
            if (d.team_id != null && teamId != null) return d.team_id === teamId;
            if (d.team_name != null) return norm(d.team_name) === teamNameKey;
            return false;
        });
    }, [team, drivers]);

    const driversWithProfile = useMemo(
        () => teamDrivers.map((d) => ({ ...d, _profile: driverProfile(d) })),
        [teamDrivers]
    );

    const sortedDrivers = useMemo(
        () => [...driversWithProfile].sort((a, b) => priorityScore(b, priority) - priorityScore(a, priority)),
        [driversWithProfile, priority]
    );

    const recommendedDriver = sortedDrivers[0] ?? null;
    const selectedProfile = selectedDriver ? driverProfile(selectedDriver) : null;
    const activePriority = PRIORITIES.find((item) => item.key === priority) ?? PRIORITIES[0];
    const teamName = getTeamName(team);

    const handleSelect = (d) => {
        setSelectedDriverLocal(d);
        setDriver(d);
    };

    const handleRandom = () => {
        if (!teamDrivers.length) return;
        handleSelect(teamDrivers[Math.floor(Math.random() * teamDrivers.length)]);
    };

    if (!team) {
        return (
            <div className="flex-1 p-6 flex items-center justify-center">
                <div className="text-f1-silver">Redirection...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 sm:p-6 f1-fade-in">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="relative overflow-hidden rounded-2xl border border-f1-border bg-f1-surface p-5 sm:p-6 shadow-2xl">
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-f1-red/18 to-transparent" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-f1-border bg-f1-dark/45 px-3 py-1 text-xs font-semibold text-f1-silver">
                                <Users size={14} aria-hidden="true" />
                                Duo pilote {teamName}
                            </div>
                            <h1 className="font-f1-display text-3xl sm:text-4xl font-black uppercase leading-tight">
                                Choisis ton <span className="text-f1-red">pilote</span>
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm sm:text-base text-f1-silver leading-relaxed">
                                Ton pilote définit le style de ta saison : attaque en qualification, régularité en course,
                                gestion des erreurs et adaptation aux circuits. Sélectionne la priorité, compare les jauges,
                                puis valide le baquet.
                            </p>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setSelectedDriverLocal(null);
                                setDriver(null);
                                navigate("/choose-team");
                            }}
                        >
                            <ArrowLeft size={16} aria-hidden="true" />
                            Retour teams
                        </Button>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <main className="space-y-5">
                        <Card className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <div className="f1-label">Priorité stratégique</div>
                                    <h2 className="font-f1-display text-lg font-bold text-f1-white">
                                        La recommandation s'adapte à ce que tu veux jouer.
                                    </h2>
                                    <p className="mt-1 text-sm text-f1-muted">
                                        Actuel : {activePriority.label} - {activePriority.hint}.
                                    </p>
                                </div>

                                <div
                                    className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[34rem]"
                                    role="group"
                                    aria-label="Priorité de comparaison des pilotes"
                                >
                                    {PRIORITIES.map((option) => (
                                        <PriorityButton
                                            key={option.key}
                                            option={option}
                                            active={priority === option.key}
                                            onClick={() => setPriority(option.key)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {loading ? (
                            <div className="flex items-center gap-3 text-f1-silver">
                                <span className="f1-spinner" />
                                Chargement des pilotes...
                            </div>
                        ) : sortedDrivers.length === 0 ? (
                            <Card className="p-5 text-f1-silver">
                                Aucun pilote disponible pour cette écurie dans cette saison.
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 f1-stagger">
                                {sortedDrivers.map((d) => (
                                    <DriverCard
                                        key={`${d.surname}_${d.number}`}
                                        driver={d}
                                        badge={sameDriver(d, recommendedDriver) ? "Recommandé" : null}
                                        isSelected={sameDriver(selectedDriver, d)}
                                        onSelect={() => handleSelect(d)}
                                    />
                                ))}
                            </div>
                        )}
                    </main>

                    <aside className="lg:sticky lg:top-6 h-fit">
                        <Card stripe className="p-5 flex flex-col gap-4 shadow-xl">
                            <div>
                                <div className="f1-label">Baquet</div>
                                <h2 className="font-f1-display text-lg font-bold uppercase text-f1-white">
                                    {selectedDriver
                                        ? `${selectedDriver.name} ${selectedDriver.surname}`
                                        : "Aucun pilote"}
                                </h2>
                            </div>

                            {selectedDriver && selectedProfile ? (
                                <>
                                    <div className="f1-soft-panel rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold text-f1-white">{teamName}</div>
                                                <div className="mt-2 flex items-center gap-2 text-sm text-f1-silver">
                                                    <FlagBadge country={selectedDriver.country} />
                                                </div>
                                            </div>
                                            <div className="font-f1-display text-3xl font-black text-f1-red">
                                                #{selectedDriver.number}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <InsightTile icon={Target} label="Profil" value={selectedProfile.archetype} />
                                        <InsightTile icon={Sparkles} label="Note" value={selectedProfile.rating} />
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-f1-border bg-f1-dark/35 p-4">
                                        <Meter label="Qualification" value={selectedProfile.qualif} detail="Vitesse + réaction" />
                                        <Meter label="Course" value={selectedProfile.race} detail="Rythme + expérience" />
                                        <Meter label="Fiabilité" value={selectedProfile.control} detail="Constance + contrôle des erreurs" />
                                        <Meter label="Pluie" value={selectedProfile.wet} detail="Affinité conditions difficiles" />
                                    </div>

                                    <p className="text-sm text-f1-muted leading-relaxed">
                                        Plus une jauge est haute, plus le pilote est solide dans ce domaine pendant la simulation.
                                        La note globale reste indicative : ton choix peut aussi dépendre du style que tu veux jouer.
                                    </p>
                                </>
                            ) : (
                                <div className="f1-soft-panel rounded-xl p-4 text-sm text-f1-silver leading-relaxed">
                                    <div className="mb-2 flex items-center gap-2 font-semibold text-f1-white">
                                        <Sparkles size={16} aria-hidden="true" />
                                        Sélectionne une carte
                                    </div>
                                    Clique sur un pilote, ou utilise Tab puis Entrée, pour afficher son profil complet ici.
                                </div>
                            )}

                            <Button onClick={() => navigate("/start-season")} disabled={!selectedDriver} fullWidth>
                                Valider ce pilote
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleRandom}
                                disabled={!teamDrivers.length}
                                fullWidth
                            >
                                Pilote aléatoire
                            </Button>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
