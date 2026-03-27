import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";
import { PODIUM_STYLE, COUNTRY_FLAG, TEAM_COLOR } from "../data/labels";
import Button from "../components/ui/Button";

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
    const flag = !isTeam && COUNTRY_FLAG[entry.country];

    return (
        <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${podium.ring} ${rank === 1 ? "scale-105" : ""}`}>
            <span className="text-4xl">{podium.rank}</span>
            <div className="text-center">
                {flag && <div className="text-2xl mb-1">{flag}</div>}
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

export default function EndOfSeason() {
    const { driver, sim, setSim } = useGame();
    const navigate = useNavigate();

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);

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

    const handleNewSeason = async () => {
        try {
            setResetting(true);
            const res = await apiFetch("/api/season/reset/", { method: "POST", body: JSON.stringify({}) });
            const newSeason = res?.season ?? currentSeason + 1;
            setSim((prev) => ({ ...prev, season: newSeason }));
            navigate("/start-season");
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
            {/* Hero */}
            <div className="text-center mb-10">
                <div className="font-f1-display text-f1-muted text-sm uppercase tracking-widest mb-2">
                    Saison {currentSeason}
                </div>
                <h1 className="font-f1-display text-4xl md:text-5xl font-black text-f1-white">
                    🏆 CHAMPION DU MONDE
                </h1>
                {champion && (
                    <div className="mt-3">
                        <span className={`font-f1-display text-2xl font-bold ${PODIUM_STYLE[1].text}`}>
                            {champion.name} {champion.surname?.toUpperCase()}
                        </span>
                        <span className="text-f1-muted ml-2">— {champion.team}</span>
                        <div className="font-f1-display text-xl text-f1-white mt-1">
                            {champion.points} pts · {champion.wins ?? 0} victoire{(champion.wins ?? 0) !== 1 ? "s" : ""}
                        </div>
                    </div>
                )}
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

            {/* CTA */}
            <div className="flex justify-center">
                <Button
                    size="xl"
                    loading={resetting}
                    onClick={handleNewSeason}
                    className="font-f1-display tracking-wider"
                >
                    🏁 Commencer la saison {currentSeason + 1}
                </Button>
            </div>
        </div>
    );
}
