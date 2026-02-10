import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import Header from "../components/Header.jsx";
import TeamCard from "../components/TeamCard.jsx";
import { apiFetch } from "../services/api.js";
import { TEAM_EXTRA } from "../data/teamExtra.js";

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

    // drivers par team (robuste)
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
        return teams.map((t) => {
            const extra = TEAM_EXTRA[t.name] || null;
            return {
                ...t,
                _drivers: driversByTeam.get(norm(t.name)) || [],
                _extra: extra,
            };
        });
    }, [teams, driversByTeam]);

    const handleSelect = (team) => {
        setSelectedTeamLocal(team);
        setTeam(team); // on garde la team API dans le context (ça va)
    };

    const handleRandom = () => {
        if (!teamsUI.length) return;
        const randomTeam = teamsUI[Math.floor(Math.random() * teamsUI.length)];
        handleSelect(randomTeam);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col">
                <Header userName={userName} userAvatar="/user.png" />
                <main className="flex-1 p-6">
                    <div className="text-lg">Chargement des teams…</div>
                </main>
            </div>
        );
    }

    const selectedDrivers = selectedTeam?._drivers || [];
    const extra = selectedTeam?._extra || null;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header userName={userName} userAvatar="/user.png" />

            <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
                {/* GAUCHE */}
                <div className="flex-1">
                    <h1 className="text-4xl font-extrabold mb-2">Bienvenue {userName}, choisis ta team</h1>
                    <p className="text-sm text-gray-300 mb-6">Clique sur une team pour la sélectionner, puis continue.</p>

                    {/* Grille */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
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
                <div className="w-full lg:w-80 h-fit bg-gray-800 border border-gray-600 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-white">
                        {selectedTeam ? `Team: ${selectedTeam.name}` : "Aucune team"}
                    </h2>

                    {/* Résumé team */}
                    <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-4 text-sm text-gray-200">
                        {selectedTeam ? (
                            extra ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Création</span>
                                        <span className="font-semibold">{extra.founded ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Base</span>
                                        <span className="font-semibold">{extra.base ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Team principal</span>
                                        <span className="font-semibold">{extra.principal ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Power Unit</span>
                                        <span className="font-semibold">{extra.powerUnit ?? "—"}</span>
                                    </div>

                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-2">
                                            <div className="text-[11px] text-gray-400">Titres Constructeurs</div>
                                            <div className="text-lg font-black">{extra.constructorTitles ?? 0}</div>
                                        </div>
                                        <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-2">
                                            <div className="text-[11px] text-gray-400">Titres Pilotes</div>
                                            <div className="text-lg font-black">{extra.driverTitles ?? 0}</div>
                                        </div>
                                    </div>

                                    {extra.highlight && (
                                        <div className="mt-2 rounded-xl border border-gray-700 bg-gray-900/30 p-3">
                                            <div className="text-[11px] text-gray-400 mb-1">À retenir</div>
                                            <div className="text-sm">{extra.highlight}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-300">
                                    Pas d’infos manuelles pour cette team (ajoute-la dans <b>teamExtra.js</b>).
                                </div>
                            )
                        ) : (
                            "Sélectionne une team pour voir les détails."
                        )}
                    </div>

                    {/* Pilotes */}
                    <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-4 text-sm text-gray-200">
                        {selectedTeam ? (
                            selectedDrivers.length ? (
                                <>
                                    <div className="text-gray-300 mb-2">Pilotes :</div>
                                    <div className="flex flex-col gap-2">
                                        {selectedDrivers.map((d) => (
                                            <div key={`${d.surname}_${d.number}`} className="flex justify-between">
                        <span className="font-semibold">
                          {d.name} {d.surname}
                        </span>
                                                <span className="text-gray-300">#{d.number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                "Pilotes : —"
                            )
                        ) : (
                            "Sélectionne une team pour voir les détails."
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/choose-driver")}
                        className="px-4 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedTeam}
                    >
                        CONTINUER
                    </button>

                    <button
                        onClick={handleRandom}
                        className="mt-auto px-4 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-600 transition"
                    >
                        Team aléatoire
                    </button>
                </div>
            </main>
        </div>
    );
}