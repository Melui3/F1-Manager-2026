import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, BadgeDollarSign, CheckCircle2, Gauge, UserRound } from "lucide-react";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";
import { PODIUM_STYLE } from "../data/labels";
import Button from "../components/ui/Button";
import FlagBadge from "../components/ui/FlagBadge";
import ChampionStage from "../components/season/ChampionStage";

function buildWcc(drivers) {
    const map = {};
    for (const d of drivers) {
        const t = d.team ?? "—";
        if (!map[t]) map[t] = { team: t, points: 0, wins: 0 };
        map[t].points += d.points ?? 0;
        map[t].wins   += d.wins   ?? 0;
    }
    return Object.values(map).sort((a, b) => b.points - a.points || b.wins - a.wins);
}

function PodiumCard({ rank, entry, isPlayer, isTeam }) {
    const podium = PODIUM_STYLE[rank];
    if (!podium) return null;

    return (
        <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${podium.ring} ${rank === 1 ? "scale-105" : ""}`}>
            <span className="text-4xl">{podium.rank}</span>
            <div className="text-center">
                {!isTeam && entry.country && <div className="mb-2 flex justify-center"><FlagBadge country={entry.country} compact /></div>}
                <div className={`font-f1-display font-bold text-sm ${podium.text}`}>
                    {isTeam ? entry.team : `${entry.name} ${entry.surname?.toUpperCase()}`}
                    {isPlayer && !isTeam && <span className="ml-1 text-[10px] text-f1-red bg-f1-red/15 px-1 py-0.5 rounded-full">TOI</span>}
                </div>
                {!isTeam && <div className="text-f1-muted text-xs mt-0.5">{entry.team}</div>}
            </div>
            <div className="font-f1-display font-bold text-xl text-f1-white">
                {entry.points} <span className="text-f1-muted text-sm font-normal">pts</span>
            </div>
            {(entry.wins ?? 0) > 0 && (
                <span className="text-xs font-bold text-f1-yellow bg-f1-yellow/10 px-2 py-0.5 rounded-full">
                    {entry.wins} victoire{entry.wins > 1 ? "s" : ""}
                </span>
            )}
        </div>
    );
}

function driverName(d) {
    if (!d) return "Pilote";
    return `${d.name} ${d.surname}`.trim();
}

function cleanDriverStat(value) {
    return Math.max(0, Number(value) || 0);
}

function driverMarketScore(d) {
    if (!d) return 0;
    return Math.round(
        cleanDriverStat(d.speed) * 7 +
        cleanDriverStat(d.racing) * 7 +
        cleanDriverStat(d.reaction) * 5 +
        cleanDriverStat(d.experience) * 4 +
        cleanDriverStat(d.consistency) * 0.6 +
        cleanDriverStat(d.points) * 0.25 +
        cleanDriverStat(d.wins) * 4 +
        cleanDriverStat(d.podiums) * 2
    );
}

function driverContractValue(d) {
    return Math.max(8, Math.round(driverMarketScore(d) / 7));
}

function resetDriverSeasonStats(d) {
    if (!d) return d;
    return {
        ...d,
        points: 0,
        wins: 0,
        podiums: 0,
        pole_positions: 0,
        fastest_laps: 0,
    };
}

export default function EndOfSeason() {
    const { driver, team, sim, setSim, setDriver } = useGame();
    const navigate = useNavigate();

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState(driver?.id ?? null);

    const currentSeason = sim?.season ?? 2026;

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch("/api/drivers/");
                setDrivers(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const wdcSorted = useMemo(
        () => [...drivers].sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (b.wins ?? 0) - (a.wins ?? 0)),
        [drivers]
    );

    const wccSorted = useMemo(() => buildWcc(drivers), [drivers]);

    const clean = (s) => String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
    const playerRank = wdcSorted.findIndex((d) =>
        clean(d.surname) === clean(driver?.surname) && d.number === driver?.number
    ) + 1;
    const playerEntry = wdcSorted[playerRank - 1];

    const champion = wdcSorted[0];

    const marketDrivers = useMemo(() => {
        const shortlist = [...drivers].sort((a, b) => driverMarketScore(b) - driverMarketScore(a)).slice(0, 12);
        const current = drivers.find((d) => Number(d.id) === Number(driver?.id));
        if (current && !shortlist.some((d) => Number(d.id) === Number(current.id))) shortlist.push(current);
        return shortlist;
    }, [driver?.id, drivers]);

    const selectedDriver = useMemo(
        () => drivers.find((d) => Number(d.id) === Number(selectedDriverId)) || playerEntry || driver,
        [driver, drivers, playerEntry, selectedDriverId]
    );

    useEffect(() => {
        if (!selectedDriverId && playerEntry?.id) setSelectedDriverId(playerEntry.id);
    }, [playerEntry?.id, selectedDriverId]);

    const handleNewSeason = async () => {
        try {
            setResetting(true);
            const res = await apiFetch("/api/season/reset/", {
                method: "POST",
                body: JSON.stringify({ full: true, advanceSeason: true }),
            });
            const newSeason = res?.season ?? currentSeason + 1;

            if (selectedDriver?.id && team?.name) {
                try {
                    const sign = await apiFetch("/api/season/driver-market/sign/", {
                        method: "POST",
                        body: JSON.stringify({
                            driver_id: selectedDriver.id,
                            team_name: team.name,
                            replaced_driver_id: driver?.id ?? null,
                        }),
                    });
                    setDriver(resetDriverSeasonStats(sign?.driver || selectedDriver));
                } catch (e) {
                    console.error(e);
                    setDriver(resetDriverSeasonStats({ ...selectedDriver, team: team.name }));
                }
            }

            setSim((prev) => ({ ...prev, season: newSeason }));
            navigate("/calendar");
        } catch (e) {
            console.error(e);
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <span className="f1-spinner" />
            </div>
        );
    }

    return (
        <div className="p-5 md:p-8 max-w-5xl mx-auto w-full f1-fade-in">
            <div className="mb-8">
                <ChampionStage champion={champion} player={driver} season={currentSeason} />
            </div>

            <div className="rounded-2xl border border-f1-border bg-f1-surface p-4 mb-8">
                <div className="font-f1-display text-xs font-bold tracking-widest text-f1-red uppercase mb-2">
                    Bilan de session
                </div>
                <p className="text-sm text-f1-silver leading-relaxed">
                    Cette page resume uniquement la saison du manager actif. Tu peux repartir sur une nouvelle
                    saison avec la meme session locale, ou retourner a l'accueil pour essayer une autre sauvegarde.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* WDC Podium */}
                <div>
                    <h2 className="font-f1-display text-sm font-bold uppercase tracking-widest text-f1-red mb-4">
                        Classement Pilotes (WDC)
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 0, 2].map((i) => {
                            const d = wdcSorted[i];
                            if (!d) return <div key={i} />;
                            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                            const isPlayer = clean(d.surname) === clean(driver?.surname) && d.number === driver?.number;
                            return <PodiumCard key={d.id ?? i} rank={rank} entry={d} isPlayer={isPlayer} />;
                        })}
                    </div>
                </div>

                {/* WCC Podium */}
                <div>
                    <h2 className="font-f1-display text-sm font-bold uppercase tracking-widest text-f1-red mb-4">
                        Classement Constructeurs (WCC)
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 0, 2].map((i) => {
                            const entry = wccSorted[i];
                            if (!entry) return <div key={i} />;
                            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                            return <PodiumCard key={entry.team} rank={rank} entry={entry} isTeam />;
                        })}
                    </div>
                </div>
            </div>

            {/* Ton résultat */}
            {playerEntry && (
                <div className={`rounded-2xl border p-5 mb-8 ${playerRank <= 3 ? PODIUM_STYLE[playerRank]?.ring : "border-f1-border bg-f1-surface/40"}`}>
                    <div className="f1-label mb-3">Ta saison {currentSeason}</div>
                    <div className="flex flex-wrap gap-6 items-center">
                        <div className="text-center">
                            <div className="font-f1-display text-4xl font-black text-f1-white">P{playerRank}</div>
                            <div className="text-f1-muted text-xs">Classement final</div>
                        </div>
                        <div className="text-center">
                            <div className="font-f1-display text-3xl font-bold text-f1-white">{playerEntry.points}</div>
                            <div className="text-f1-muted text-xs">Points</div>
                        </div>
                        <div className="text-center">
                            <div className="font-f1-display text-3xl font-bold text-f1-yellow">{playerEntry.wins ?? 0}</div>
                            <div className="text-f1-muted text-xs">Victoires</div>
                        </div>
                        <div className="text-center">
                            <div className="font-f1-display text-3xl font-bold text-f1-silver">{playerEntry.podiums ?? 0}</div>
                            <div className="text-f1-muted text-xs">Podiums</div>
                        </div>
                        <div className="text-center">
                            <div className="font-f1-display text-3xl font-bold text-sky-400">{playerEntry.pole_positions ?? 0}</div>
                            <div className="text-f1-muted text-xs">Poles</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Marché pilotes */}
            <div className="rounded-2xl border border-f1-border bg-f1-surface/70 p-5 mb-8 f1-slide-up">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
                    <div>
                        <div className="f1-label mb-2">Saison suivante</div>
                        <h2 className="font-f1-display text-2xl font-black text-f1-white">
                            Marché pilotes
                        </h2>
                        <p className="text-sm text-f1-silver leading-relaxed max-w-3xl mt-2">
                            Choisis le pilote que tu veux aligner avec {team?.name || "ton écurie"} pour la saison {currentSeason + 1}.
                            En mode local, le transfert est sauvegardé dans ta session : le pilote choisi rejoint ton équipe,
                            et ton pilote actuel prend son ancien baquet si besoin.
                        </p>
                    </div>
                    {selectedDriver && (
                        <div className="rounded-xl border border-f1-red/30 bg-f1-red/10 px-4 py-3 text-sm text-f1-white">
                            <div className="flex items-center gap-2 font-f1-display font-bold">
                                <ArrowRightLeft size={16} className="text-f1-red" />
                                Choix actif
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-f1-silver">
                                <FlagBadge country={selectedDriver.country} compact />
                                <span>{driverName(selectedDriver)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {marketDrivers.map((d) => {
                        const selected = Number(d.id) === Number(selectedDriver?.id);
                        const sameAsCurrent = Number(d.id) === Number(driver?.id);
                        return (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => setSelectedDriverId(d.id)}
                                className={[
                                    "group text-left rounded-xl border p-4 transition-all duration-200 f1-motion-card",
                                    selected
                                        ? "border-f1-red bg-f1-red/12 shadow-lg shadow-f1-red/10"
                                        : "border-f1-border bg-f1-dark/50 hover:border-f1-red/50 hover:bg-f1-surface-2/70",
                                ].join(" ")}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <FlagBadge country={d.country} compact />
                                            {sameAsCurrent && (
                                                <span className="rounded-full border border-f1-yellow/30 bg-f1-yellow/10 px-2 py-0.5 text-[10px] font-bold text-f1-yellow">
                                                    Actuel
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-f1-display text-lg font-black text-f1-white mt-3">
                                            {driverName(d)}
                                        </div>
                                        <div className="text-xs text-f1-muted mt-0.5">{d.team}</div>
                                    </div>
                                    {selected ? (
                                        <CheckCircle2 size={20} className="text-f1-red" aria-hidden="true" />
                                    ) : (
                                        <UserRound size={20} className="text-f1-muted group-hover:text-f1-red" aria-hidden="true" />
                                    )}
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-lg border border-f1-border bg-f1-surface/60 px-3 py-2">
                                        <div className="flex items-center gap-1.5 text-f1-muted">
                                            <Gauge size={13} aria-hidden="true" />
                                            Niveau
                                        </div>
                                        <div className="font-f1-display text-lg font-bold text-f1-white">
                                            {driverMarketScore(d)}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-f1-border bg-f1-surface/60 px-3 py-2">
                                        <div className="flex items-center gap-1.5 text-f1-muted">
                                            <BadgeDollarSign size={13} aria-hidden="true" />
                                            Valeur
                                        </div>
                                        <div className="font-f1-display text-lg font-bold text-f1-white">
                                            {driverContractValue(d)} M€
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
                <Button
                    size="xl"
                    loading={resetting}
                    onClick={handleNewSeason}
                    className="font-f1-display tracking-wider"
                >
                    🏁 Commencer la saison {currentSeason + 1}
                </Button>
                <p className="text-xs text-f1-muted text-center max-w-xl">
                    Le classement est remis à zéro, ton budget repart sur une base propre, et ton choix de pilote est gardé dans cette session.
                </p>
            </div>
        </div>
    );
}
