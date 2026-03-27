import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import Header from "../components/Header.jsx";
import TeamCard from "../components/TeamCard.jsx";
import { apiFetch } from "../services/api.js";
import { TEAM_EXTRA } from "../data/teamExtra.js";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const norm = (s) => String(s ?? "").trim().toLowerCase();

export default function ChooseTeam() {
    const { userName, setTeam } = useGame();
    const [selectedTeam, setSelectedTeamLocal] = useState(null);
    const [teams, setTeams] = useState([]);
    const [drivers, setDrivers] = useState([]);
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
        }));
    }, [teams, driversByTeam]);

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
            <div className="min-h-screen bg-f1-dark text-f1-white flex flex-col">
                <Header userName={userName} />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-f1-silver">
                        <span className="f1-spinner" />
                        Chargement des teams…
                    </div>
                </main>
            </div>
        );
    }

    const selectedDrivers = selectedTeam?._drivers || [];
    const extra = selectedTeam?._extra || null;

    return (
        <div className="min-h-screen bg-f1-dark text-f1-white flex flex-col">
            <Header userName={userName} />

            <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 f1-fade-in">
                {/* GAUCHE */}
                <div className="flex-1">
                    <h1 className="font-f1-display text-3xl font-bold mb-1">
                        CHOISIS TA <span className="text-f1-red">TEAM</span>
                    </h1>
                    <p className="text-sm text-f1-silver mb-6">
                        Bienvenue {userName} — sélectionne une écurie pour continuer.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
                        {teamsUI.map((team) => (
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
                <Card stripe className="w-full lg:w-80 h-fit p-5 flex flex-col gap-4 shadow-lg">
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
                                            <div className="text-[11px] text-f1-muted mb-1">À retenir</div>
                                            <div className="text-sm text-f1-silver">{extra.highlight}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-f1-silver">
                                    Pas d'infos manuelles pour cette team (ajoute-la dans <b>teamExtra.js</b>).
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
                </Card>
            </main>
        </div>
    );
}
