import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import DriverCard from "../components/DriverCard";
import { apiFetch } from "../services/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

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

    // Si pas de team -> retour
    useEffect(() => {
        if (!team) navigate("/choose-team", { replace: true });
    }, [team, navigate]);

    const teamDrivers = useMemo(() => {
        if (!team || !Array.isArray(drivers)) return [];

        const teamId = team.id;
        const teamNameKey = norm(team.name);

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
                <div className="text-f1-silver">Redirection…</div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 f1-fade-in">
                {/* GAUCHE */}
                <div className="flex-1">
                    <h1 className="font-f1-display text-3xl font-bold mb-1">
                        CHOISIS TON <span className="text-f1-red">PILOTE</span>
                    </h1>
                    <p className="text-sm text-f1-silver mb-4">
                        {team.name} — sélectionne un pilote pour continuer.
                    </p>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="mb-6"
                        onClick={() => {
                            setSelectedDriverLocal(null);
                            setDriver(null);
                            navigate("/choose-team");
                        }}
                    >
                        ← Retour teams
                    </Button>

                    {loading ? (
                        <div className="flex items-center gap-3 text-f1-silver">
                            <span className="f1-spinner" />
                            Chargement des pilotes…
                        </div>
                    ) : teamDrivers.length === 0 ? (
                        <div className="text-f1-silver">
                            Aucun pilote trouvé pour cette team. (Vérifie le champ team côté API)
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                            {teamDrivers.map((d) => (
                                <DriverCard
                                    key={`${d.surname}_${d.number}`}
                                    driver={d}
                                    isSelected={
                                        selectedDriver
                                            ? selectedDriver.number === d.number && selectedDriver.surname === d.surname
                                            : false
                                    }
                                    onSelect={() => handleSelect(d)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* DROITE */}
                <Card stripe className="w-full lg:w-80 h-fit p-5 flex flex-col gap-4 shadow-lg">
                    <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-silver uppercase">
                        {selectedDriver
                            ? `${selectedDriver.name} ${selectedDriver.surname}`
                            : "Aucun pilote"}
                    </h2>

                    <div className="rounded-xl bg-f1-dark/60 border border-f1-border p-4 text-sm">
                        <div className="f1-label mb-1">Team</div>
                        <div className="font-semibold text-f1-white">{team.name}</div>

                        {selectedDriver && (
                            <div className="mt-3 flex flex-col gap-1.5">
                                <div className="flex justify-between">
                                    <span className="text-f1-muted">Pays</span>
                                    <span className="font-semibold text-f1-white">{selectedDriver.country}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-f1-muted">Numéro</span>
                                    <span className="font-f1-display font-bold text-f1-white">#{selectedDriver.number}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => navigate("/start-season")}
                        disabled={!selectedDriver}
                        fullWidth
                    >
                        CONTINUER
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
        </div>
    );
}
