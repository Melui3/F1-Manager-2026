import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import Header from "../components/Header";
import DriverCard from "../components/DriverCard";
import { apiFetch } from "../services/api";

const norm = (s) => String(s ?? "").trim().toLowerCase();

export default function ChooseDriver() {
    const { userName, team, setDriver } = useGame();
    const [selectedDriver, setSelectedDriverLocal] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // ✅ Filtre simple + robuste (string, object, ids) + normalisation
    const teamDrivers = useMemo(() => {
        if (!team || !Array.isArray(drivers)) return [];

        const teamId = team.id;
        const teamName = team.name;
        const teamNameKey = norm(teamName);

        return drivers.filter((d) => {
            const t = d.team;

            // team est un objet
            if (t && typeof t === "object") {
                if (t.id != null && teamId != null) return t.id === teamId;
                if (t.name) return norm(t.name) === teamNameKey;
            }

            // team est une string
            if (typeof t === "string") {
                return norm(t) === teamNameKey;
            }

            // team est un number
            if (typeof t === "number") {
                return teamId != null && t === teamId;
            }

            // champs alternatifs
            if (d.team_id != null && teamId != null) return d.team_id === teamId;
            if (d.team_name != null) return norm(d.team_name) === teamNameKey;

            return false;
        });
    }, [team, drivers]);

    const handleSelect = (driver) => {
        setSelectedDriverLocal(driver);
        setDriver(driver);
    };

    const handleRandom = () => {
        if (!teamDrivers.length) return;
        const randomDriver = teamDrivers[Math.floor(Math.random() * teamDrivers.length)];
        handleSelect(randomDriver);
    };

    // ✅ garde ton écran si pas de team
    if (!team) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col">
                <Header userName={userName} userAvatar="/user.png" />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold mb-4">Aucune team sélectionnée</h1>
                        <p className="text-gray-300">Retourne à la page précédente pour choisir une team.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header userName={userName} userAvatar="/user.png" />

            <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
                {/* GAUCHE */}
                <div className="flex-1">
                    <h1 className="text-4xl font-extrabold mb-2">
                        Choisis ton pilote pour {team.name}
                    </h1>
                    <p className="text-sm text-gray-300 mb-6">
                        Clique sur un pilote pour le sélectionner, puis continue.
                    </p>
                    <button
                        onClick={() => {
                            setSelectedDriverLocal(null);
                            setDriver(null);          // ✅ si ton context l'accepte
                            navigate("/choose-team"); // ✅ retour
                        }}
                        className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 transition font-semibold"
                    >
                        ← Retour teams
                    </button>
                    {loading ? (
                        <div className="text-gray-300">Chargement des pilotes…</div>
                    ) : teamDrivers.length === 0 ? (
                        <div className="text-gray-300">
                            Aucun pilote trouvé pour cette team. (Vérifie que driver.team == "{team.name}" côté API)
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                            {teamDrivers.map((d) => (
                                <DriverCard
                                    key={`${d.surname}_${d.number}`} // stable avec ton backend
                                    driver={d}
                                    isSelected={
                                        selectedDriver
                                            ? (selectedDriver.number === d.number && selectedDriver.surname === d.surname)
                                            : false
                                    }
                                    onSelect={() => handleSelect(d)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* DROITE */}
                <div className="w-full lg:w-80 h-fit bg-gray-800 border border-gray-600 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-white">
                        {selectedDriver
                            ? `Pilote : ${selectedDriver.name} ${selectedDriver.surname}`
                            : "Aucun pilote"}
                    </h2>

                    <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-4 text-sm text-gray-200">
                        <div className="text-gray-300 mb-2">Team :</div>
                        <div className="font-semibold">{team.name}</div>

                        {selectedDriver && (
                            <div className="mt-3 text-gray-300">
                                <div>Pays : <b className="text-white">{selectedDriver.country}</b></div>
                                <div>Numéro : <b className="text-white">#{selectedDriver.number}</b></div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/startseason")}
                        className="px-4 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedDriver}
                    >
                        CONTINUER
                    </button>

                    <button
                        onClick={handleRandom}
                        className="mt-auto px-4 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!teamDrivers.length}
                    >
                        Pilote aléatoire
                    </button>
                </div>
            </main>
        </div>
    );
}