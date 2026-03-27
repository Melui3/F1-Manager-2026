import { useEffect, useMemo, useState } from "react";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";
import { COUNTRY_FLAG, TEAM_COLOR, PODIUM_STYLE } from "../data/labels";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flag(country) {
    return COUNTRY_FLAG[country] ?? "🏁";
}

function teamDot(teamName) {
    const color = TEAM_COLOR[teamName]?.dot ?? "bg-f1-muted";
    return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

function PodiumBadge({ rank }) {
    const s = PODIUM_STYLE[rank];
    if (!s) return <span className="font-f1-display text-sm font-bold text-f1-silver w-6 text-center">{rank}</span>;
    return <span className={`font-f1-display text-sm font-bold w-6 text-center ${s.text}`}>{s.rank}</span>;
}

// ─── WCC (calculé côté front) ─────────────────────────────────────────────────

function buildWcc(drivers) {
    const map = {};
    for (const d of drivers) {
        const t = d.team ?? "—";
        if (!map[t]) map[t] = { team: t, points: 0, wins: 0, drivers: [] };
        map[t].points += d.points ?? 0;
        map[t].wins   += d.wins   ?? 0;
        map[t].drivers.push(`${d.name} ${d.surname}`);
    }
    return Object.values(map).sort((a, b) => b.points - a.points || b.wins - a.wins);
}

// ─── Ligne de classement ──────────────────────────────────────────────────────

function DriverRow({ rank, driver, isPlayer }) {
    const podium = PODIUM_STYLE[rank];

    return (
        <div
            className={[
                "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors",
                isPlayer
                    ? "border-f1-red/40 bg-f1-red/5 font-semibold"
                    : podium
                        ? `${podium.ring} font-medium`
                        : "border-f1-border bg-f1-dark/30",
            ].join(" ")}
        >
            <PodiumBadge rank={rank} />

            <span className="text-base">{flag(driver.country)}</span>

            <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${isPlayer ? "text-f1-white" : podium ? podium.text : "text-f1-white"}`}>
                    {driver.name} <span className="uppercase">{driver.surname}</span>
                    {isPlayer && <span className="ml-2 text-[10px] font-bold text-f1-red bg-f1-red/15 px-1.5 py-0.5 rounded-full">TOI</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {teamDot(driver.team)}
                    <span className="text-f1-muted text-xs truncate">{driver.team}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <span className="font-f1-display font-bold text-base text-f1-white tabular-nums">
                    {driver.points ?? 0}
                </span>
                <span className="text-f1-muted text-xs">pts</span>
            </div>
        </div>
    );
}

function TeamRow({ rank, entry }) {
    const podium = PODIUM_STYLE[rank];
    const color  = TEAM_COLOR[entry.team];

    return (
        <div
            className={[
                "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors",
                podium ? `${podium.ring} font-medium` : "border-f1-border bg-f1-dark/30",
            ].join(" ")}
        >
            <PodiumBadge rank={rank} />

            <div
                className={`w-1 self-stretch rounded-full shrink-0 ${color?.dot ?? "bg-f1-muted"}`}
            />

            <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${podium ? podium.text : "text-f1-white"}`}>
                    {entry.team}
                </div>
                <div className="text-f1-muted text-xs truncate">
                    {entry.drivers.join(" · ")}
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <span className="font-f1-display font-bold text-base text-f1-white tabular-nums">
                    {entry.points}
                </span>
                <span className="text-f1-muted text-xs">pts</span>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Standings() {
    const { driver: playerDriver } = useGame();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState("wdc"); // "wdc" | "wcc"

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await apiFetch("/api/drivers/");
                setDrivers(Array.isArray(data) ? data : []);
            } catch (e) {
                setError(e?.message || "Erreur chargement");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const wdcSorted = useMemo(
        () => [...drivers].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)),
        [drivers]
    );

    const wccSorted = useMemo(() => buildWcc(drivers), [drivers]);

    const leader = wdcSorted[0];

    return (
        <div className="p-5 md:p-8 max-w-4xl mx-auto w-full f1-fade-in">
            {/* Titre */}
            <div className="mb-6">
                <h1 className="font-f1-display text-3xl font-bold">
                    CLASSEMENTS <span className="text-f1-red">2026</span>
                </h1>
                {!loading && leader && (
                    <p className="text-f1-silver text-sm mt-1">
                        Leader : <span className="text-f1-white font-semibold">{leader.name} {leader.surname}</span>
                        {" "}— <span className="font-f1-display">{leader.points ?? 0}</span> pts
                    </p>
                )}
            </div>

            {/* Tabs WDC / WCC */}
            <div className="flex gap-1 mb-5 p-1 bg-f1-surface rounded-xl w-fit border border-f1-border">
                {[
                    { key: "wdc", label: "Pilotes (WDC)" },
                    { key: "wcc", label: "Constructeurs (WCC)" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={[
                            "px-5 py-2 rounded-lg text-sm font-semibold font-f1 transition-all",
                            tab === key
                                ? "bg-f1-red text-white shadow"
                                : "text-f1-silver hover:text-f1-white",
                        ].join(" ")}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Contenu */}
            {loading ? (
                <div className="flex items-center gap-3 text-f1-silver py-12 justify-center">
                    <span className="f1-spinner" /> Chargement…
                </div>
            ) : error ? (
                <div className="text-red-400 text-sm">{error}</div>
            ) : tab === "wdc" ? (
                <div className="flex flex-col gap-2">
                    {wdcSorted.map((d, i) => {
                        const isPlayer =
                            playerDriver &&
                            d.surname?.toLowerCase() === playerDriver.surname?.toLowerCase() &&
                            d.number === playerDriver.number;
                        return (
                            <DriverRow
                                key={`${d.surname}_${d.number}`}
                                rank={i + 1}
                                driver={d}
                                isPlayer={isPlayer}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {wccSorted.map((entry, i) => (
                        <TeamRow key={entry.team} rank={i + 1} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
}
