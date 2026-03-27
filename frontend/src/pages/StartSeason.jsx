import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import Header from "../components/Header.jsx";
import { apiFetch } from "../services/api";
import SessionResultsModal from "../components/modals/SessionResultsModal";
import WdcModal from "../components/modals/WdcModal";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";

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
    "McLaren Mastercard Formula 1 Team": "border-orange-400/70 shadow-orange-500/10",
    "Aston Martin Aramco Formula One Team": "border-emerald-500/60 shadow-emerald-500/20",
    "BWT Alpine F1 Team": "border-sky-400/60 shadow-sky-400/20",
    "Audi F1 Team (Revolut)": "border-zinc-200/40 shadow-zinc-200/10",
    "Cadillac Formula One Team": "border-yellow-400/60 shadow-yellow-400/20",
    "TGR Hass F1 Team": "border-gray-200/40 shadow-gray-200/10",
    "Atlassian Williams Racing": "border-sky-500/60 shadow-sky-500/20",
    "Visa Cash App Racing Bulls F1 Team": "border-indigo-400/60 shadow-indigo-400/20",
};

const clean = (s) =>
    String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");

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
                card: "border-f1-green/30 bg-f1-green/5 hover:bg-f1-green/8",
                pill: "bg-f1-green/15 text-f1-green border-f1-green/30",
                label: "Déjà passé",
            };
        case "in_progress":
            return {
                card: "border-f1-yellow/30 bg-f1-yellow/5 hover:bg-f1-yellow/8",
                pill: "bg-f1-yellow/15 text-f1-yellow border-f1-yellow/30",
                label: "En cours",
            };
        default:
            return {
                card: "border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/8",
                pill: "bg-sky-500/15 text-sky-300 border-sky-500/30",
                label: "Prochainement",
            };
    }
}

function StatCell({ label, value, delta }) {
    const d = typeof delta === "number" ? delta : null;
    const deltaTxt = d === null ? null : d > 0 ? `+${d}` : `${d}`;

    return (
        <div className="rounded-xl border border-f1-border bg-f1-dark/50 p-3">
            <div className="text-[11px] text-f1-muted">{label}</div>
            <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <div className="font-f1-display text-sm font-bold text-f1-white">{value ?? "—"}</div>
                {deltaTxt !== null && deltaTxt !== "0" && (
                    <div className={`text-xs font-bold ${d > 0 ? "text-f1-green" : "text-f1-red"}`}>
                        {deltaTxt}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatsGrid({ stats, prevStats }) {
    if (!stats) return <div className="text-sm text-f1-silver">Stats indisponibles.</div>;

    const delta = (k) =>
        typeof stats?.[k] === "number" && typeof prevStats?.[k] === "number" ? stats[k] - prevStats[k] : null;

    return (
        <div className="grid grid-cols-3 gap-2">
            <StatCell label="Speed"       value={stats.speed}       delta={delta("speed")} />
            <StatCell label="Racing"      value={stats.racing}      delta={delta("racing")} />
            <StatCell label="Reaction"    value={stats.reaction}    delta={delta("reaction")} />
            <StatCell label="Experience"  value={stats.experience}  delta={delta("experience")} />
            <StatCell label="Consistency" value={stats.consistency} delta={delta("consistency")} />
            <StatCell label="Error rate"  value={stats.error_rate}  delta={delta("error_rate")} />
            <StatCell label="Street"      value={stats.street}      delta={delta("street")} />
            <StatCell label="High speed"  value={stats.high}        delta={delta("high")} />
            <StatCell label="Wet"         value={stats.wet}         delta={delta("wet")} />
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

    const [activeModal, setActiveModal] = useState(null);
    const [wdcShown, setWdcShown] = useState(false);

    const [wdcBoard, setWdcBoard] = useState([]);
    const [wdcLoading, setWdcLoading] = useState(false);
    const [wdcError, setWdcError] = useState(null);

    const [simAllLoading, setSimAllLoading] = useState(false);
    const [simAllProgress, setSimAllProgress] = useState({ done: 0, total: 0 });
    const simAllAbortRef = useRef(false);

    if (!team || !driver) {
        return (
            <div className="min-h-screen bg-f1-dark text-f1-white flex flex-col">
                <Header userName={userName} />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="font-f1-display text-2xl font-bold mb-2">Team ou pilote manquant</h1>
                        <p className="text-f1-silver">Retourne choisir une team puis un pilote.</p>
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

    const playerRow = useMemo(() => driversBoard.find((d) => isSameDriver(d, driver)) || null, [driversBoard, driver]);
    const playerPoints = playerRow?.points ?? 0;

    const playerLast = useMemo(
        () => lastResults.find((r) => isSameDriver(r, driver)) || null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const teamBorder = TEAM_STYLE[team.name] || "border-f1-border";

    const seasonDone = useMemo(
        () => Array.isArray(calendar) && calendar.length > 0 && calendar.every((s) => !!s.is_simulated),
        [calendar]
    );

    const toggleGp = (gpName) => setExpandedGp((cur) => (cur === gpName ? null : gpName));

    const openWdc = async () => {
        try {
            setWdcError(null);
            setWdcLoading(true);
            const board = await apiFetch("/api/drivers/");
            setWdcBoard(Array.isArray(board) ? board : []);
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

    const simulateOne = async (sessionIndex, force = false, metaOverride = null) => {
        try {
            if (playerStats) setPrevPlayerStats(playerStats);
            setSimLoading(true);
            setError(null);

            const meta = metaOverride || flatSessions.find((s) => s?.index === sessionIndex) || null;
            setLastSessionMeta(meta);

            const url = force
                ? `/api/simulate/session/${sessionIndex}/?force=1`
                : `/api/simulate/session/${sessionIndex}/`;
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

        const url = force
            ? `/api/simulate/session/${sessionIndex}/?force=1`
            : `/api/simulate/session/${sessionIndex}/`;
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

    useEffect(() => {
        if (!seasonDone || wdcShown || activeModal !== null) return;
        (async () => {
            setWdcShown(true);
            await openWdc();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seasonDone, wdcShown, activeModal]);

    const isBusy = simLoading || simAllLoading;

    return (
        <div className="min-h-screen bg-f1-dark flex flex-col text-f1-white">
            <Header userName={userName} />

            <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* LEFT */}
                <section className="flex-1 flex flex-col gap-5">
                    {/* Header card */}
                    <Card stripe className="p-5 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                            <div className="flex-1">
                                <h1 className="font-f1-display text-2xl md:text-3xl font-bold">
                                    CALENDRIER <span className="text-f1-red">2026</span>
                                </h1>

                                <div className="mt-4 rounded-xl border border-f1-border bg-f1-dark/60 p-4">
                                    <h2 className="font-f1-display text-sm font-bold text-f1-white mb-2 tracking-wide">
                                        COMMENT ÇA MARCHE ?
                                    </h2>
                                    <ul className="text-sm text-f1-silver space-y-1.5 leading-relaxed">
                                        <li>• Clique un <b className="text-f1-white">GP</b> pour afficher ses sessions.</li>
                                        <li>• <b className="text-f1-white">Simuler</b> lance la session et ouvre les résultats.</li>
                                        <li>• <b className="text-f1-white">Simuler next</b> lance la prochaine session non simulée.</li>
                                        <li>• <b className="text-f1-white">Simuler tout</b> enchaîne toutes les sessions restantes.</li>
                                        <li>• <b className="text-f1-white">Force</b> resimule même si déjà simulé.</li>
                                        <li>• Fin de saison : <b className="text-f1-white">WDC</b> affiche le classement final.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Boutons simulation */}
                            <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                                <Button
                                    onClick={() => simulateNext(false)}
                                    disabled={isBusy || !nextSession}
                                    loading={simLoading}
                                >
                                    {simLoading ? "Simulation…" : "Simuler next"}
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => simulateNext(true)}
                                    disabled={isBusy || !nextSession}
                                >
                                    Force next
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30"
                                    onClick={() => simulateAll(false)}
                                    disabled={isBusy || !nextSession}
                                    loading={simAllLoading}
                                >
                                    {simAllLoading
                                        ? `Saison… (${simAllProgress.done}/${simAllProgress.total})`
                                        : "Simuler tout"}
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="bg-emerald-950/60 hover:bg-emerald-950/80 text-emerald-400 border border-emerald-700/40"
                                    onClick={() => simulateAll(true)}
                                    disabled={isBusy || !nextSession}
                                >
                                    Force tout
                                </Button>

                                {simAllLoading && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => { simAllAbortRef.current = true; }}
                                    >
                                        Stop
                                    </Button>
                                )}
                            </div>
                        </div>

                        {nextSession && (
                            <div className="mt-4 text-xs text-f1-muted">
                                Prochaine session :{" "}
                                <span className="text-f1-silver font-semibold">{nextSession.gp_name}</span>
                                {" "}• {nextSession.session_type} • index {nextSession.index}
                            </div>
                        )}
                    </Card>

                    {error && (
                        <Alert type="error">{error}</Alert>
                    )}

                    {/* Calendrier */}
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <div className="flex items-center gap-3 text-f1-silver px-1">
                                <span className="f1-spinner" /> Chargement…
                            </div>
                        ) : gpNames.length === 0 ? (
                            <Card className="p-5 text-f1-silver">
                                Aucun GP reçu depuis l'API.
                                <div className="text-xs text-f1-muted mt-2">
                                    Vérifie <b>/api/season/calendar/</b>
                                </div>
                            </Card>
                        ) : (
                            gpNames.map((gpName) => {
                                const sessions = calendarByGp[gpName] || [];
                                const status = gpStatus(sessions);
                                const ui = statusUI(status);
                                const gpDate = sessions?.[0]?.date ?? "—";
                                const circuit = sessions?.[0]?.circuit_name ?? "—";

                                return (
                                    <div
                                        key={gpName}
                                        className={`border-2 rounded-2xl p-4 md:p-5 transition-all ${ui.card}`}
                                    >
                                        <div
                                            className="flex items-center justify-between gap-3 cursor-pointer"
                                            onClick={() => toggleGp(gpName)}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-f1-display font-bold text-base text-f1-white">
                                                        {gpName}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ui.pill}`}>
                                                        {ui.label}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-f1-silver">
                                                    {circuit} • {gpDate}
                                                </span>
                                            </div>
                                            <span className="text-f1-muted text-sm">
                                                {expandedGp === gpName ? "▲" : "▼"}
                                            </span>
                                        </div>

                                        {expandedGp === gpName && (
                                            <div className="mt-4 flex flex-col gap-2 f1-fade-in">
                                                {sessions.map((s) => (
                                                    <div
                                                        key={s.index}
                                                        className="rounded-xl bg-f1-surface/60 border border-f1-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                                    >
                                                        <div className="text-sm">
                                                            <div className="font-semibold text-f1-white">
                                                                {s.session_type}{" "}
                                                                <span className="text-f1-muted font-normal">
                                                                    ({s.circuit_type})
                                                                </span>
                                                            </div>
                                                            <div className="text-f1-silver text-xs mt-0.5">
                                                                {s.date ?? "—"}{" "}
                                                                {s.is_simulated ? (
                                                                    <span className="ml-2 text-f1-green">✔ simulé</span>
                                                                ) : (
                                                                    <span className="ml-2 text-f1-muted">non simulé</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => simulateOne(s.index, false, s)}
                                                                disabled={isBusy}
                                                            >
                                                                Simuler
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => simulateOne(s.index, true, s)}
                                                                disabled={isBusy}
                                                            >
                                                                Force
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Dernière session */}
                    {lastResults.length > 0 && (
                        <Card className="p-5 md:p-6">
                            <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase mb-4">
                                Dernière session
                            </h2>

                            <div className="mb-4 rounded-xl bg-f1-dark/60 border border-f1-border p-4">
                                <div className="f1-label mb-3">Stats pilote</div>
                                <StatsGrid stats={playerStats} prevStats={prevPlayerStats} />
                            </div>

                            {playerLast && (
                                <div className="mb-4 rounded-xl bg-f1-dark/60 border border-f1-border p-4">
                                    <div className="f1-label mb-2">Ton résultat</div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-f1-white">
                                            {playerLast.position ? `${playerLast.position}. ` : ""}
                                            {playerLast.name} {playerLast.surname}
                                        </span>
                                        <span className="font-f1-display text-f1-yellow">
                                            +{playerLast.points_gained} pts
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                {lastResults.slice(0, 10).map((r) => (
                                    <div
                                        key={`${r.position}-${r.surname}-${r.number}`}
                                        className="flex justify-between text-sm rounded-xl bg-f1-dark/50 border border-f1-border px-3 py-2"
                                    >
                                        <span className="text-f1-silver">
                                            {r.position ? `${r.position}. ` : ""}
                                            <span className="text-f1-white font-medium">{r.name} {r.surname}</span>{" "}
                                            <span className="text-f1-muted">({r.team})</span>
                                        </span>
                                        <span className="font-f1-display text-f1-silver">+{r.points_gained}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </section>

                {/* RIGHT */}
                <aside className="w-full lg:w-[360px] flex flex-col gap-5 lg:sticky lg:top-6 h-fit">
                    {/* Carte pilote/team */}
                    <div className={`bg-f1-surface border-2 rounded-2xl p-5 md:p-6 shadow-lg flex flex-col items-center gap-4 ${teamBorder}`}>
                        <Button
                            variant="secondary"
                            fullWidth
                            disabled={isBusy}
                            onClick={() => {
                                setDriver(null);
                                setTeam(null);
                                navigate("/choose-team");
                            }}
                        >
                            Refaire les choix
                        </Button>

                        <img
                            src={driverImgSrc(driver)}
                            alt={`${driver.name} ${driver.surname}`}
                            className="h-28 w-28 rounded-full border-2 border-f1-red object-cover object-top"
                            onError={(e) => e.currentTarget.remove()}
                        />

                        <div className="text-center">
                            <div className="font-f1-display font-bold text-base text-f1-white">
                                {driver.name} {driver.surname}
                            </div>
                            <div className="font-f1-display text-f1-red text-sm mt-0.5">#{driver.number}</div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-f1-silver">
                            <img
                                src={teamLogoSrc(team.name)}
                                alt={team.name}
                                className="h-5 w-5 object-contain"
                                onError={(e) => e.currentTarget.remove()}
                            />
                            <span>{team.name}</span>
                        </div>

                        <div className="w-full rounded-xl bg-f1-dark/60 border border-f1-border p-4 text-center">
                            <div className="f1-label">Points</div>
                            <div className="font-f1-display text-4xl font-black text-f1-white mt-1">
                                {playerPoints}
                            </div>
                        </div>

                        <div className="w-full rounded-xl bg-f1-dark/60 border border-f1-border p-4">
                            <div className="f1-label mb-3">Stats pilote</div>
                            <StatsGrid stats={playerStats} prevStats={prevPlayerStats} />
                        </div>

                        <Button
                            variant="secondary"
                            fullWidth
                            disabled={isBusy}
                            onClick={resetSeason}
                        >
                            Reset saison
                        </Button>
                    </div>

                    {/* Leaderboard */}
                    <Card className="p-5 md:p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase">
                                Leaderboard
                            </h2>
                            <Button
                                variant="secondary"
                                size="sm"
                                loading={wdcLoading}
                                disabled={wdcLoading}
                                onClick={openWdc}
                            >
                                WDC
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex items-center gap-2 text-f1-silver text-sm">
                                <span className="f1-spinner" /> Chargement…
                            </div>
                        ) : driversBoard.length === 0 ? (
                            <div className="text-f1-silver text-sm">Aucun pilote dans le classement.</div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {driversBoard.map((d, idx) => {
                                    const isPlayer = isSameDriver(d, driver);
                                    return (
                                        <div
                                            key={`${d.surname}_${d.number}`}
                                            className={[
                                                "flex justify-between px-3 py-2 rounded-xl border text-sm",
                                                isPlayer
                                                    ? "bg-f1-surface-2 border-f1-muted font-semibold text-f1-white"
                                                    : "bg-f1-dark/40 border-f1-border text-f1-silver",
                                            ].join(" ")}
                                        >
                                            <span>
                                                {idx + 1}.{" "}
                                                <span className={isPlayer ? "text-f1-white" : "text-f1-silver"}>
                                                    {d.name} {d.surname}
                                                </span>{" "}
                                                <span className="text-f1-muted">({d.team})</span>
                                            </span>
                                            <span className="font-f1-display">{d.points}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
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
