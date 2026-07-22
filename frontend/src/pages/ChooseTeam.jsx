import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Gauge, ShieldCheck, Sparkles, Trophy, Users, Wrench } from "lucide-react";
import { useGame } from "../context/GameContext";
import TeamCard from "../components/TeamCard.jsx";
import { apiFetch } from "../services/api.js";
import { TEAM_EXTRA } from "../data/teamExtra.js";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const norm = (s) => String(s ?? "").trim().toLowerCase();

const FILTERS = [
    { key: "all", label: "Toutes", hint: "Toute la grille" },
    { key: "title", label: "Titre", hint: "Pression maximale" },
    { key: "heritage", label: "Historique", hint: "Grand nom" },
    { key: "project", label: "Projet", hint: "Construction" },
    { key: "underdog", label: "Défi", hint: "Remontee" },
];

function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}

function averageDriverRating(drivers = []) {
    if (!drivers.length) return 55;
    const sum = drivers.reduce((acc, d) => {
        const pace = ((Number(d.speed) || 0) + (Number(d.racing) || 0) + (Number(d.reaction) || 0)) / 3;
        const craft = ((Number(d.experience) || 0) + ((Number(d.consistency) || 0) / 10)) / 2;
        return acc + ((pace * 7) + (craft * 3));
    }, 0);
    return clamp(sum / drivers.length);
}

function teamProfile(extra, drivers = []) {
    const constructorTitles = Number(extra?.constructorTitles || 0);
    const driverTitles = Number(extra?.driverTitles || 0);
    const debut = Number(extra?.debutF1 || 2026);
    const age = Math.max(0, 2026 - debut);
    const driverRating = averageDriverRating(drivers);
    const heritage = clamp((constructorTitles * 6) + (driverTitles * 3) + (age * 0.35));
    const pressure = constructorTitles >= 8 || driverRating >= 85 ? "Haute" : constructorTitles > 0 ? "Moyenne" : "Faible";
    const development = clamp(100 - (driverRating * 0.45) + (constructorTitles === 0 ? 22 : 8) + (debut >= 2026 ? 16 : 0));

    let category = "project";
    if (constructorTitles >= 8 || driverRating >= 88) category = "title";
    else if (constructorTitles >= 2) category = "heritage";
    else if (constructorTitles === 0) category = "underdog";

    return {
        category,
        driverRating,
        heritage,
        development,
        pressure,
        difficulty: pressure === "Haute" ? "Exigeante" : category === "underdog" ? "Patiente" : "Equilibree",
    };
}

function ProfileMeter({ label, value }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-f1-muted uppercase tracking-wider">{label}</span>
                <span className="font-f1-display font-bold text-f1-white">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full border border-f1-border bg-f1-dark">
                <div className="h-full rounded-full bg-f1-red transition-all duration-500" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function Insight({ icon: Icon, label, value }) {
    const iconNode = Icon ? <Icon className="h-3.5 w-3.5 text-f1-red" aria-hidden="true" /> : null;

    return (
        <div className="rounded-xl border border-f1-border bg-f1-dark/55 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-f1-muted">
                {iconNode}
                {label}
            </div>
            <div className="font-f1-display text-sm font-bold text-f1-white">{value}</div>
        </div>
    );
}

export default function ChooseTeam() {
    const { userName, setTeam } = useGame();
    const [selectedTeam, setSelectedTeamLocal] = useState(null);
    const [teams, setTeams] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const teamsRes = await apiFetch("/api/teams/");
                const driversRes = await apiFetch("/api/drivers/");
                setTeams(Array.isArray(teamsRes) ? teamsRes : []);
                setDrivers(Array.isArray(driversRes) ? driversRes : []);
            } catch (err) {
                console.error("Failed to load teams or drivers", err);
                setTeams([]);
                setDrivers([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const driversByTeam = useMemo(() => {
        const map = new Map();
        for (const d of drivers) {
            const key = norm(d?.team);
            if (!key) continue;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(d);
        }
        return map;
    }, [drivers]);

    const teamsUI = useMemo(() => {
        return teams.map((t) => ({
            ...t,
            _drivers: driversByTeam.get(norm(t.name)) || [],
            _extra: TEAM_EXTRA[t.name] || null,
        })).map((team) => ({
            ...team,
            _profile: teamProfile(team._extra, team._drivers),
        }));
    }, [teams, driversByTeam]);

    const filteredTeams = useMemo(() => {
        if (activeFilter === "all") return teamsUI;
        return teamsUI.filter((team) => team._profile?.category === activeFilter);
    }, [activeFilter, teamsUI]);

    const handleSelect = (team) => {
        setSelectedTeamLocal(team);
        setTeam(team);
    };

    const handleRandom = () => {
        if (!teamsUI.length) return;
        handleSelect(teamsUI[Math.floor(Math.random() * teamsUI.length)]);
    };

    if (loading) {
        return (
            <div className="flex-1 p-6 flex items-center justify-center">
                <div className="flex items-center gap-3 text-f1-silver">
                    <span className="f1-spinner" />Chargement des teams…
                </div>
            </div>
        );
    }

    const selectedDrivers = selectedTeam?._drivers || [];
    const extra = selectedTeam?._extra || null;
    const profile = selectedTeam?._profile || null;

    return (
        <div className="flex-1 p-5 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 f1-fade-in">
                {/* GAUCHE */}
                <div className="flex-1">
                    <div className="mb-6 rounded-2xl border border-f1-border bg-f1-surface/75 p-5 md:p-6 overflow-hidden relative">
                        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-f1-red/10 to-transparent pointer-events-none" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 rounded-full border border-f1-red/30 bg-f1-red/10 px-3 py-1 text-xs font-bold text-f1-red">
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                Début de carrière
                            </div>
                            <h1 className="font-f1-display text-3xl md:text-4xl font-black mt-4">
                                Choisis ton <span className="text-f1-red">garage</span>
                            </h1>
                            <p className="text-sm text-f1-silver mt-2 max-w-3xl leading-relaxed">
                                Bienvenue {userName}. Une team n'est pas juste un logo : c'est un niveau de pression,
                                un duo pilote, une histoire et une marge de progression pour ta sauvegarde locale.
                            </p>
                        </div>
                    </div>

                    <Card className="p-4 mb-6">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="font-f1-display text-xs font-bold tracking-widest text-f1-red uppercase">
                                    Type de carrière
                                </div>
                                <p className="text-xs text-f1-muted mt-1">
                                    Filtre selon l'ambiance de saison que tu veux jouer.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-f1-muted">
                                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                                {filteredTeams.length}/{teamsUI.length} teams
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2" role="list" aria-label="Filtres de carrière">
                            {FILTERS.map((filter) => {
                                const active = activeFilter === filter.key;
                                return (
                                    <button
                                        key={filter.key}
                                        type="button"
                                        onClick={() => setActiveFilter(filter.key)}
                                        aria-pressed={active}
                                        className={[
                                            "rounded-xl border px-3 py-2 text-left transition-all outline-none",
                                            "focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-2 focus-visible:ring-offset-f1-dark",
                                            active
                                                ? "border-f1-red bg-f1-red/15 text-f1-white"
                                                : "border-f1-border bg-f1-dark/40 text-f1-silver hover:border-f1-red/40",
                                        ].join(" ")}
                                    >
                                        <div className="font-f1-display text-xs font-bold">{filter.label}</div>
                                        <div className="text-[11px] text-f1-muted">{filter.hint}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start f1-stagger">
                        {filteredTeams.map((team) => (
                            <TeamCard
                                key={team.id ?? team.name}
                                team={team}
                                drivers={team._drivers}
                                extra={team._extra}
                                isSelected={(selectedTeam?.id ?? selectedTeam?.name) === (team.id ?? team.name)}
                                onSelect={() => handleSelect(team)}
                            />
                        ))}
                    </div>
                </div>

                {/* DROITE */}
                <Card stripe className="w-full lg:w-96 h-fit p-5 flex flex-col gap-4 shadow-lg lg:sticky lg:top-6">
                    <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-silver uppercase">
                        {selectedTeam ? selectedTeam.name : "Aucune team"}
                    </h2>

                    {/* Résumé */}
                    <div className="rounded-xl bg-f1-dark/60 border border-f1-border p-4 text-sm">
                        {selectedTeam ? (
                            extra ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between">
                                        <span className="text-f1-muted">Création</span>
                                        <span className="font-semibold text-f1-white">{extra.founded ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-f1-muted">Base</span>
                                        <span className="font-semibold text-f1-white">{extra.base ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-f1-muted">Team principal</span>
                                        <span className="font-semibold text-f1-white text-right">{extra.principal ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-f1-muted">Power Unit</span>
                                        <span className="font-semibold text-f1-white">{extra.powerUnit ?? "—"}</span>
                                    </div>

                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div className="rounded-xl border border-f1-border bg-f1-dark/60 p-2 text-center">
                                            <div className="text-[11px] text-f1-muted">Titres Constructeurs</div>
                                            <div className="font-f1-display text-lg font-black text-f1-white">{extra.constructorTitles ?? 0}</div>
                                        </div>
                                        <div className="rounded-xl border border-f1-border bg-f1-dark/60 p-2 text-center">
                                            <div className="text-[11px] text-f1-muted">Titres Pilotes</div>
                                            <div className="font-f1-display text-lg font-black text-f1-white">{extra.driverTitles ?? 0}</div>
                                        </div>
                                    </div>

                                    {extra.highlight && (
                                        <div className="mt-2 rounded-xl border border-f1-border bg-f1-dark/60 p-3">
                                            <div className="text-[11px] text-f1-muted mb-1">Résumé</div>
                                            <div className="text-sm text-f1-silver">{extra.highlight}</div>
                                        </div>
                                    )}

                                    {profile && (
                                        <div className="mt-2 grid gap-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Insight icon={Gauge} label="Pression" value={profile.pressure} />
                                                <Insight icon={Wrench} label="Difficulté" value={profile.difficulty} />
                                                <Insight icon={Trophy} label="Heritage" value={`${profile.heritage}/100`} />
                                                <Insight icon={Users} label="Duo pilote" value={`${profile.driverRating}/100`} />
                                            </div>
                                            <div className="rounded-xl border border-f1-border bg-f1-dark/60 p-3">
                                                <div className="f1-label mb-3">Profil rapide</div>
                                                <div className="grid gap-2">
                                                    <ProfileMeter label="Duo pilote" value={profile.driverRating} />
                                                    <ProfileMeter label="Héritage" value={profile.heritage} />
                                                    <ProfileMeter label="Marge R&D" value={profile.development} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-f1-silver">
                                    Informations detaillees indisponibles pour cette ecurie.
                                </div>
                            )
                        ) : (
                            <span className="text-f1-muted">Sélectionne une team pour voir les détails.</span>
                        )}
                    </div>

                    {/* Pilotes */}
                    <div className="rounded-xl bg-f1-dark/60 border border-f1-border p-4 text-sm">
                        {selectedTeam ? (
                            selectedDrivers.length ? (
                                <>
                                    <div className="f1-label mb-2">Pilotes</div>
                                    <div className="flex flex-col gap-2">
                                        {selectedDrivers.map((d) => (
                                            <div key={`${d.surname}_${d.number}`} className="flex justify-between">
                                                <span className="font-semibold text-f1-white">{d.name} {d.surname}</span>
                                                <span className="font-f1-display text-f1-silver">#{d.number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <span className="text-f1-muted">Pilotes : —</span>
                            )
                        ) : (
                            <span className="text-f1-muted">Sélectionne une team pour voir les détails.</span>
                        )}
                    </div>

                    <Button
                        onClick={() => navigate("/choose-driver")}
                        disabled={!selectedTeam}
                        fullWidth
                    >
                        CONTINUER
                    </Button>

                    <Button variant="outline" onClick={handleRandom} fullWidth>
                        Team aléatoire
                    </Button>

                    <div className="rounded-xl border border-f1-border bg-f1-dark/45 p-3 text-xs text-f1-muted">
                        <div className="mb-1 flex items-center gap-2 font-semibold text-f1-silver">
                            <ShieldCheck className="h-3.5 w-3.5 text-f1-red" aria-hidden="true" />
                            Sauvegarde locale
                        </div>
                        Ton choix est enregistré uniquement dans la session active de ce navigateur.
                    </div>
                </Card>
        </div>
    );
}
