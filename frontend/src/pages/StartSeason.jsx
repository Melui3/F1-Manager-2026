import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import Header from "../components/Header.jsx";
import { apiFetch } from "../services/api";
import SessionResultsModal from "../components/modals/SessionResultsModal";
import WdcModal from "../components/modals/WdcModal";

// === TEAM MAPS ===
const TEAM_KEY_MAP = {
    "Oracle Red Bull Racing": "redbull",
    "Scuderia Ferrari HP": "ferrari",
    "Mercedes-AMG Petronas Formula One Team": "mercedes",
    "McLaren Mastercard Formula 1 Team": "mclaren",
    "Aston Martin Aramco Formula One Team": "astonmartin",
    "BWT Alpine F1 Team": "alpine",
    "Audi F1 Team (Revolut)": "audi",
    "Cadillac Formula One Team": "cadillac",
    "TGR Hass F1 Team": "haas",
    "Atlassian Williams Racing": "williams",
    "Visa Cash App Racing Bulls F1 Team": "racingbulls",
};

const TEAM_STYLE = {
    "Oracle Red Bull Racing": "border-blue-500/60 shadow-blue-500/20",
    "Scuderia Ferrari HP": "border-red-500/70 shadow-red-500/20",
    "Mercedes-AMG Petronas Formula One Team": "border-emerald-400/60 shadow-emerald-400/20",
    "McLaren Mastercard Formula 1 Team": "border-orange-400/70 shadow-orange-400/20",
    "Aston Martin Aramco Formula One Team": "border-emerald-500/60 shadow-emerald-500/20",
    "BWT Alpine F1 Team": "border-sky-400/60 shadow-sky-400/20",
    "Audi F1 Team (Revolut)": "border-zinc-200/40 shadow-zinc-200/10",
    "Cadillac Formula One Team": "border-yellow-400/60 shadow-yellow-400/20",
    "TGR Hass F1 Team": "border-gray-200/40 shadow-gray-200/10",
    "Atlassian Williams Racing": "border-sky-500/60 shadow-sky-500/20",
    "Visa Cash App Racing Bulls F1 Team": "border-indigo-400/60 shadow-indigo-400/20",
};

// ✅ robust helpers
const clean = (s) =>
    String(s ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "");

const getNumber = (x) => {
    const n = Number(String(x ?? "").trim());
    return Number.isFinite(n) ? n : null;
};

const isSameDriver = (a, b) => {
    const aSurname = clean(a?.surname ?? a?.last_name);
    const bSurname = clean(b?.surname ?? b?.last_name);
    const aNum = getNumber(a?.number ?? a?.driver_number);
    const bNum = getNumber(b?.number ?? b?.driver_number);
    return !!aSurname && !!bSurname && aSurname === bSurname && aNum !== null && aNum === bNum;
};

function driverImgSrc(d) {
    const base = import.meta.env.BASE_URL || "/";
    const surname = d?.surname ?? "";
    const number = d?.number ?? "";
    if (!surname || number === "") return null;
    return `${base}drivers/${String(surname).toLowerCase()}_${number}.avif`;
}

function teamLogoSrc(teamName) {
    const base = import.meta.env.BASE_URL || "/";
    const key = TEAM_KEY_MAP[teamName];
    return key ? `${base}teams/${key}.avif` : null;
}

function gpStatus(sessions = []) {
    if (!sessions.length) return "upcoming";
    const total = sessions.length;
    const done = sessions.filter((s) => !!s.is_simulated).length;
    if (done === 0) return "upcoming";
    if (done < total) return "in_progress";
    return "done";
}

function statusUI(status) {
    switch (status) {
        case "done":
            return {
                card: "border-green-500/40 bg-green-900/10 hover:bg-green-900/15",
                pill: "bg-green-500/15 text-green-300 border-green-500/30",
                label: "Déjà passé",
            };
        case "in_progress":
            return {
                card: "border-yellow-500/40 bg-yellow-900/10 hover:bg-yellow-900/15",
                pill: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
                label: "En cours",
            };
        default:
            return {
                card: "border-sky-500/40 bg-sky-900/10 hover:bg-sky-900/15",
                pill: "bg-sky-500/15 text-sky-300 border-sky-500/30",
                label: "Prochainement",
            };
    }
}

// ===== UI stats =====
function StatCell({ label, value, delta }) {
    const d = typeof delta === "number" ? delta : null;
    const deltaTxt = d === null ? null : d > 0 ? `+${d}` : `${d}`;

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-2">
            <div className="text-[11px] text-gray-400">{label}</div>
            <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm font-extrabold text-white">{value ?? "—"}</div>
                {deltaTxt !== null && deltaTxt !== "0" && (
                    <div className={`text-xs font-bold ${d > 0 ? "text-green-400" : "text-red-400"}`}>{deltaTxt}</div>
                )}
            </div>
        </div>
    );
}

function StatsGrid({ stats, prevStats }) {
    if (!stats) return <div className="text-sm text-gray-300">Stats indisponibles.</div>;

    const delta = (k) =>
        typeof stats?.[k] === "number" && typeof prevStats?.[k] === "number" ? stats[k] - prevStats[k] : null;

    return (
        <div className="grid grid-cols-3 gap-2">
            <StatCell label="Speed" value={stats.speed} delta={delta("speed")} />
            <StatCell label="Racing" value={stats.racing} delta={delta("racing")} />
            <StatCell label="Reaction" value={stats.reaction} delta={delta("reaction")} />
            <StatCell label="Experience" value={stats.experience} delta={delta("experience")} />
            <StatCell label="Consistency" value={stats.consistency} delta={delta("consistency")} />
            <StatCell label="Error rate" value={stats.error_rate} delta={delta("error_rate")} />
            <StatCell label="Street" value={stats.street} delta={delta("street")} />
            <StatCell label="High speed" value={stats.high} delta={delta("high")} />
            <StatCell label="Wet" value={stats.wet} delta={delta("wet")} />
        </div>
    );
}

export default function StartSeason() {
    const { userName, team, driver, setTeam, setDriver } = useGame();
    const navigate = useNavigate();

    const [expandedGp, setExpandedGp] = useState(null);

    const [calendar, setCalendar] = useState([]);
    const [driversBoard, setDriversBoard] = useState([]);

    const [loading, setLoading] = useState(true);
    const [simLoading, setSimLoading] = useState(false);
    const [error, setError] = useState(null);

    const [lastResults, setLastResults] = useState([]);
    const [lastSessionMeta, setLastSessionMeta] = useState(null);

    const [prevPlayerStats, setPrevPlayerStats] = useState(null);
    const [playerStats, setPlayerStats] = useState(null);

    const [resultsTick, setResultsTick] = useState(0);

    // ✅ ONE MODAL MANAGER
    const [activeModal, setActiveModal] = useState(null); // null | "session" | "wdc"
    const [wdcShown, setWdcShown] = useState(false);

    // ✅ WDC dedicated board (anti “modale vide”)
    const [wdcBoard, setWdcBoard] = useState([]);
    const [wdcLoading, setWdcLoading] = useState(false);
    const [wdcError, setWdcError] = useState(null);

    // === SIMULER TOUT ===
    const [simAllLoading, setSimAllLoading] = useState(false);
    const [simAllProgress, setSimAllProgress] = useState({ done: 0, total: 0 });
    const simAllAbortRef = useRef(false);

    if (!team || !driver) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col">
                <Header userName={userName} />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold mb-2">Team ou pilote manquant</h1>
                        <p className="text-gray-300">Retourne choisir une team puis un pilote.</p>
                    </div>
                </main>
            </div>
        );
    }

    const calendarByGp = useMemo(() => {
        const map = {};
        for (const s of calendar) {
            const gp = s?.gp_name ?? "GP inconnu";
            if (!map[gp]) map[gp] = [];
            map[gp].push(s);
        }
        for (const k of Object.keys(map)) {
            map[k].sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));
        }
        return map;
    }, [calendar]);

    const gpNames = useMemo(() => Object.keys(calendarByGp), [calendarByGp]);

    const flatSessions = useMemo(() => {
        const arr = Array.isArray(calendar) ? [...calendar] : [];
        arr.sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));
        return arr;
    }, [calendar]);

    const nextSession = useMemo(() => flatSessions.find((s) => !s?.is_simulated) || null, [flatSessions]);

    async function refreshAll() {
        const [cal, board] = await Promise.all([apiFetch("/api/season/calendar/"), apiFetch("/api/drivers/")]);
        setCalendar(Array.isArray(cal) ? cal : []);
        setDriversBoard(Array.isArray(board) ? board : []);
    }

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                setLoading(true);
                await refreshAll();
            } catch (e) {
                console.error(e);
                setError(e?.message || "Erreur lors du chargement");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // points joueur depuis leaderboard
    const playerRow = useMemo(() => driversBoard.find((d) => isSameDriver(d, driver)) || null, [driversBoard, driver]);
    const playerPoints = playerRow?.points ?? 0;

    const playerLast = useMemo(
        () => lastResults.find((r) => isSameDriver(r, driver)) || null,
        [lastResults, driver, resultsTick]
    );

    useEffect(() => {
        if (!playerRow) return;
        setPlayerStats({
            speed: playerRow.speed,
            racing: playerRow.racing,
            reaction: playerRow.reaction,
            experience: playerRow.experience,
            consistency: playerRow.consistency,
            error_rate: playerRow.error_rate,
            street: playerRow.street_circuit_affinity,
            high: playerRow.high_speed_circuit_affinity,
            wet: playerRow.wet_circuit_affinity,
            points: playerRow.points,
        });
    }, [playerRow]);

    const teamBorder = TEAM_STYLE[team.name] || "border-gray-700 shadow-black/0";

    const seasonDone = useMemo(
        () => Array.isArray(calendar) && calendar.length > 0 && calendar.every((s) => !!s.is_simulated),
        [calendar]
    );

    const toggleGp = (gpName) => setExpandedGp((cur) => (cur === gpName ? null : gpName));

    // ✅ Open WDC (fetch dedicated board NOW)
    const openWdc = async () => {
        try {
            setWdcError(null);
            setWdcLoading(true);

            const board = await apiFetch("/api/drivers/");
            const safe = Array.isArray(board) ? board : [];
            setWdcBoard(safe);

            setActiveModal("wdc");
        } catch (e) {
            console.error(e);
            setWdcBoard([]);
            setWdcError(e?.message || "Erreur chargement WDC");
            setActiveModal("wdc");
        } finally {
            setWdcLoading(false);
        }
    };

    // ===== Simulate 1 session (avec modal)
    const simulateOne = async (sessionIndex, force = false, metaOverride = null) => {
        try {
            if (playerStats) setPrevPlayerStats(playerStats);

            setSimLoading(true);
            setError(null);

            const meta = metaOverride || flatSessions.find((s) => s?.index === sessionIndex) || null;
            setLastSessionMeta(meta);

            const url = force ? `/api/simulate/session/${sessionIndex}/?force=1` : `/api/simulate/session/${sessionIndex}/`;
            const res = await apiFetch(url, { method: "POST", body: JSON.stringify({}) });

            const results = Array.isArray(res?.results) ? res.results : [];
            setLastResults(results);
            setResultsTick((t) => t + 1);

            await refreshAll();
            setActiveModal("session");
        } catch (e) {
            console.error(e);
            setError(e?.message || "Erreur simulation");
        } finally {
            setSimLoading(false);
        }
    };

    const simulateOneSilent = async (sessionIndex, force = false, metaOverride = null) => {
        const meta = metaOverride || flatSessions.find((s) => s?.index === sessionIndex) || null;
        setLastSessionMeta(meta);

        const url = force ? `/api/simulate/session/${sessionIndex}/?force=1` : `/api/simulate/session/${sessionIndex}/`;
        const res = await apiFetch(url, { method: "POST", body: JSON.stringify({}) });

        const results = Array.isArray(res?.results) ? res.results : [];
        setLastResults(results);
        setResultsTick((t) => t + 1);

        await refreshAll();
    };

    const simulateNext = async (force = false) => {
        if (!nextSession) return;
        await simulateOne(nextSession.index, force, nextSession);
    };

    const simulateAll = async (force = false) => {
        const remaining = flatSessions.filter((s) => !s?.is_simulated);
        if (!remaining.length) return;

        try {
            simAllAbortRef.current = false;
            setSimAllLoading(true);
            setError(null);
            setSimAllProgress({ done: 0, total: remaining.length });

            setActiveModal(null);

            for (let i = 0; i < remaining.length; i++) {
                if (simAllAbortRef.current) break;
                if (playerStats) setPrevPlayerStats(playerStats);

                const s = remaining[i];
                await simulateOneSilent(s.index, force, s);
                setSimAllProgress({ done: i + 1, total: remaining.length });
            }

            setActiveModal("session");
        } catch (e) {
            console.error(e);
            setError(e?.message || "Erreur simulation totale");
        } finally {
            setSimAllLoading(false);
        }
    };

    const resetSeason = async () => {
        try {
            setSimLoading(true);
            setError(null);

            await apiFetch("/api/season/reset/", { method: "POST", body: JSON.stringify({}) });

            setCalendar([]);
            setDriversBoard([]);
            setLastResults([]);
            setExpandedGp(null);

            setPrevPlayerStats(null);
            setPlayerStats(null);

            setWdcShown(false);
            setActiveModal(null);
            setLastSessionMeta(null);
            setWdcBoard([]);
            setWdcError(null);

            setResultsTick((t) => t + 1);
            await refreshAll();
        } catch (e) {
            console.error(e);
            setError(e?.message || "Erreur reset");
        } finally {
            setSimLoading(false);
        }
    };

    // ✅ Auto WDC end season (fetch WDC board, not driversBoard)
    useEffect(() => {
        if (!seasonDone) return;
        if (wdcShown) return;
        if (activeModal !== null) return;

        (async () => {
            setWdcShown(true);
            await openWdc();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seasonDone, wdcShown, activeModal]);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col text-white">
            <Header userName={userName} />

            <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
                {/* LEFT */}
                <section className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h1 className="text-4xl font-extrabold">Calendrier 2026</h1>
                            <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-4">
                                <h2 className="text-lg font-extrabold text-white mb-2">Comment ça marche ?</h2>
                                <ul className="text-sm text-gray-200 space-y-1">
                                    <li>• Clique un <b>GP</b> pour afficher ses sessions (Practice / Qualif / Race).</li>
                                    <li>• <b>Simuler</b> lance la session et ouvre la modale de résultats.</li>
                                    <li>• <b>Simuler next</b> lance la prochaine session non simulée.</li>
                                    <li>• <b>Simuler tout</b> enchaîne toutes les sessions restantes.</li>
                                    <li>• Après chaque session : points + progression stats, et le <b>Leaderboard</b> se met à jour.</li>
                                    <li>• <b>Force</b> resimule une session même si déjà simulée (pratique pour tester).</li>
                                    <li>• Fin de saison : <b>WDC</b> affiche le classement final.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => simulateNext(false)}
                                disabled={simLoading || simAllLoading || !nextSession}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {simLoading ? "Simulation..." : "Simuler next"}
                            </button>

                            <button
                                onClick={() => simulateNext(true)}
                                disabled={simLoading || simAllLoading || !nextSession}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Force next
                            </button>

                            <button
                                onClick={() => simulateAll(false)}
                                disabled={simLoading || simAllLoading || !nextSession}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {simAllLoading ? `Saison... (${simAllProgress.done}/${simAllProgress.total})` : "Simuler tout"}
                            </button>

                            <button
                                onClick={() => simulateAll(true)}
                                disabled={simLoading || simAllLoading || !nextSession}
                                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Force tout
                            </button>

                            {simAllLoading && (
                                <button
                                    onClick={() => {
                                        simAllAbortRef.current = true;
                                    }}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition border border-gray-700"
                                >
                                    Stop
                                </button>
                            )}
                        </div>
                    </div>

                    {nextSession && (
                        <div className="text-xs text-gray-400">
                            Prochaine session : <b className="text-gray-200">{nextSession.gp_name}</b> • {nextSession.session_type} • index{" "}
                            {nextSession.index}
                        </div>
                    )}
                    <div className="text-xs text-gray-500">
                        Astuce : commence par <b>Simuler next</b>, puis utilise <b>Simuler tout</b> quand tu veux avancer vite.
                    </div>
                    {error && <div className="p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-200">{error}</div>}

                    {loading ? (
                        <div className="text-gray-300">Chargement…</div>
                    ) : gpNames.length === 0 ? (
                        <div className="border-2 border-gray-700 rounded-2xl p-4 bg-gray-800/50 text-gray-300">
                            Aucun GP reçu depuis l’API.
                            <div className="text-xs text-gray-400 mt-2">
                                Vérifie <b>/api/season/calendar/</b>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {gpNames.map((gpName) => {
                                const sessions = calendarByGp[gpName] || [];
                                const status = gpStatus(sessions);
                                const ui = statusUI(status);

                                const gpDate = sessions?.[0]?.date ?? "—";
                                const circuit = sessions?.[0]?.circuit_name ?? "—";

                                return (
                                    <div key={gpName} className={`border-2 rounded-2xl p-4 transition ${ui.card}`}>
                                        <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => toggleGp(gpName)}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-lg">{gpName}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full border ${ui.pill}`}>{ui.label}</span>
                                                </div>
                                                <span className="text-sm text-gray-300">
                          {circuit} • {gpDate}
                        </span>
                                            </div>

                                            <span className="text-sm text-gray-300">{expandedGp === gpName ? "▲" : "▼"}</span>
                                        </div>

                                        {expandedGp === gpName && (
                                            <div className="mt-4 flex flex-col gap-2">
                                                {sessions.map((s) => (
                                                    <div
                                                        key={s.index}
                                                        className="rounded-xl bg-gray-800/60 border border-gray-700 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                                    >
                                                        <div className="text-sm text-gray-200">
                                                            <div className="font-semibold">
                                                                {s.session_type} <span className="text-gray-400">({s.circuit_type})</span>
                                                            </div>
                                                            <div className="text-gray-300 text-xs mt-0.5">
                                                                Date : {s.date ?? "—"}{" "}
                                                                {s.is_simulated ? <span className="ml-2 text-green-400">✔ simulé</span> : <span className="ml-2 text-gray-400">non simulé</span>}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => simulateOne(s.index, false, s)}
                                                                disabled={simLoading || simAllLoading}
                                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition disabled:opacity-50"
                                                            >
                                                                Simuler
                                                            </button>
                                                            <button
                                                                onClick={() => simulateOne(s.index, true, s)}
                                                                disabled={simLoading || simAllLoading}
                                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition disabled:opacity-50"
                                                            >
                                                                Force
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {lastResults.length > 0 && (
                        <div className="mt-2 bg-gray-800 border border-gray-700 rounded-2xl p-4">
                            <h2 className="font-bold text-lg text-red-400 mb-2">Dernière session</h2>

                            <div className="mb-3 rounded-xl bg-gray-900/50 border border-gray-700 p-3">
                                <div className="text-xs text-gray-400 mb-2">Stats pilote</div>
                                <StatsGrid stats={playerStats} prevStats={prevPlayerStats} />
                            </div>

                            {playerLast && (
                                <div className="mb-3 rounded-xl bg-gray-900/50 border border-gray-700 p-3">
                                    <div className="text-xs text-gray-400">Ton résultat</div>
                                    <div className="mt-1 flex justify-between text-sm">
                    <span className="font-semibold">
                      {playerLast.position ? `${playerLast.position}. ` : ""}
                        {playerLast.name} {playerLast.surname}
                    </span>
                                        <span className="text-gray-300">+{playerLast.points_gained} pts</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                {lastResults.slice(0, 10).map((r) => (
                                    <div key={`${r.position}-${r.surname}-${r.number}`} className="flex justify-between text-sm">
                    <span>
                      {r.position ? `${r.position}. ` : ""}
                        {r.name} {r.surname} <span className="text-gray-400">({r.team})</span>
                    </span>
                                        <span className="text-gray-300">+{r.points_gained} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* RIGHT */}
                <aside className="w-full lg:w-80 flex flex-col gap-6">
                    <div className={`bg-gray-800 border-2 rounded-2xl p-4 shadow-lg flex flex-col items-center gap-2 ${teamBorder}`}>
                        <button
                            onClick={() => {
                                setDriver(null);
                                setTeam(null);
                                navigate("/choose-team");
                            }}
                            disabled={simLoading || simAllLoading}
                            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition border border-gray-700 disabled:opacity-50"
                        >
                            Refaire les choix
                        </button>

                        <img
                            src={driverImgSrc(driver)}
                            alt={`${driver.name} ${driver.surname}`}
                            className="h-28 w-28 rounded-full border-2 border-red-500 object-cover object-top"
                            onError={(e) => e.currentTarget.remove()}
                        />

                        <div className="text-center">
                            <div className="font-extrabold text-lg">
                                {driver.name} {driver.surname}
                            </div>
                            <div className="text-sm text-gray-300">#{driver.number}</div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <img
                                src={teamLogoSrc(team.name)}
                                alt={team.name}
                                className="h-5 w-5 object-contain"
                                onError={(e) => e.currentTarget.remove()}
                            />
                            <span>{team.name}</span>
                        </div>

                        <div className="mt-2 w-full rounded-xl bg-gray-900/50 border border-gray-700 p-3 text-center">
                            <div className="text-xs text-gray-400">Points</div>
                            <div className="text-2xl font-black text-white">{playerPoints}</div>
                        </div>

                        <div className="mt-3 w-full rounded-xl bg-gray-900/50 border border-gray-700 p-3">
                            <div className="text-xs text-gray-400 mb-2">Stats pilote</div>
                            <StatsGrid stats={playerStats} prevStats={prevPlayerStats} />
                        </div>

                        <button
                            onClick={resetSeason}
                            disabled={simLoading || simAllLoading}
                            className="mt-3 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition disabled:opacity-50"
                        >
                            Reset saison
                        </button>
                    </div>

                    <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-lg text-red-500">Leaderboard</h2>
                            <button
                                onClick={openWdc}
                                disabled={wdcLoading}
                                className="text-xs px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {wdcLoading && (
                                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                                )}
                                WDC
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-gray-300">Chargement…</div>
                        ) : driversBoard.length === 0 ? (
                            <div className="text-gray-300">Aucun pilote dans le classement.</div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {driversBoard.map((d, idx) => {
                                    const isPlayer = isSameDriver(d, driver);

                                    return (
                                        <div
                                            key={`${d.surname}_${d.number}`}
                                            className={`flex justify-between p-2 rounded-xl ${
                                                isPlayer ? "bg-gray-700 font-semibold" : "bg-gray-900/30"
                                            }`}
                                        >
                      <span className="text-sm">
                        {idx + 1}. {d.name} {d.surname} <span className="text-gray-400">({d.team})</span>
                      </span>
                                            <span className="text-sm">{d.points} pts</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>
            </main>

            <SessionResultsModal
                open={activeModal === "session"}
                onClose={() => setActiveModal(null)}
                results={lastResults}
                player={driver}
                sessionMeta={lastSessionMeta}
                playerStats={playerStats}
                prevPlayerStats={prevPlayerStats}
            />

            <WdcModal
                open={activeModal === "wdc"}
                onClose={() => setActiveModal(null)}
                board={wdcBoard}
                player={driver}
                loading={wdcLoading}
                error={wdcError}
                onReload={openWdc}
            />
        </div>
    );
}