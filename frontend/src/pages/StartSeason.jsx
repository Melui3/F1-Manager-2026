import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";
import SessionResultsModal from "../components/modals/SessionResultsModal";
import WdcModal from "../components/modals/WdcModal";
import CalendarSection from "../components/season/CalendarSection";
import PlayerCard from "../components/season/PlayerCard";

// ─── Team border styles ───────────────────────────────────────────────────────

const TEAM_STYLE = {
    "Oracle Red Bull Racing":                 "border-blue-500/60",
    "Scuderia Ferrari HP":                    "border-red-500/70",
    "Mercedes-AMG Petronas Formula One Team": "border-emerald-400/60",
    "McLaren Mastercard Formula 1 Team":      "border-orange-400/70",
    "Aston Martin Aramco Formula One Team":   "border-emerald-500/60",
    "BWT Alpine F1 Team":                     "border-sky-400/60",
    "Audi F1 Team (Revolut)":                 "border-zinc-200/40",
    "Cadillac Formula One Team":              "border-yellow-400/60",
    "TGR Hass F1 Team":                       "border-gray-200/40",
    "Atlassian Williams Racing":              "border-sky-500/60",
    "Visa Cash App Racing Bulls F1 Team":     "border-indigo-400/60",
};

// ─── Driver matching ──────────────────────────────────────────────────────────

const clean = (s) =>
    String(s ?? "").trim().toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StartSeason() {
    const { team, driver } = useGame();

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

    // ── Early return (no team/driver) ──────────────────────────────────────────
    if (!team || !driver) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="font-f1-display text-2xl font-bold mb-2">Team ou pilote manquant</h1>
                    <p className="text-f1-silver">Retourne choisir une team puis un pilote.</p>
                </div>
            </div>
        );
    }

    // ── Derived state ──────────────────────────────────────────────────────────

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

    const totalSessions = flatSessions.length;
    const simulatedSessions = flatSessions.filter((s) => !!s.is_simulated).length;

    const playerRow = useMemo(() => driversBoard.find((d) => isSameDriver(d, driver)) || null, [driversBoard, driver]);
    const playerPoints = playerRow?.points ?? 0;

    const seasonDone = useMemo(
        () => Array.isArray(calendar) && calendar.length > 0 && calendar.every((s) => !!s.is_simulated),
        [calendar]
    );

    const isBusy = simLoading || simAllLoading;

    // ── Effects ────────────────────────────────────────────────────────────────

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

    useEffect(() => {
        if (!playerRow) return;
        setPlayerStats({
            speed:       playerRow.speed,
            racing:      playerRow.racing,
            reaction:    playerRow.reaction,
            experience:  playerRow.experience,
            consistency: playerRow.consistency,
            error_rate:  playerRow.error_rate,
            street:      playerRow.street_circuit_affinity,
            high:        playerRow.high_speed_circuit_affinity,
            wet:         playerRow.wet_circuit_affinity,
            points:      playerRow.points,
        });
    }, [playerRow]);

    useEffect(() => {
        if (!seasonDone || wdcShown || activeModal !== null) return;
        setWdcShown(true);
        openWdc();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seasonDone, wdcShown, activeModal]);

    // ── Actions ────────────────────────────────────────────────────────────────

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

            setLastResults(Array.isArray(res?.results) ? res.results : []);
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

        setLastResults(Array.isArray(res?.results) ? res.results : []);
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

    const toggleGp = (gpName) => setExpandedGp((cur) => (cur === gpName ? null : gpName));

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
            <CalendarSection
                loading={loading}
                error={error}
                gpNames={gpNames}
                calendarByGp={calendarByGp}
                expandedGp={expandedGp}
                toggleGp={toggleGp}
                nextSession={nextSession}
                isBusy={isBusy}
                simLoading={simLoading}
                simAllLoading={simAllLoading}
                simAllProgress={simAllProgress}
                onSimulateNext={() => simulateNext(false)}
                onForceNext={() => simulateNext(true)}
                onSimulateAll={() => simulateAll(false)}
                onForceAll={() => simulateAll(true)}
                onSimulateOne={simulateOne}
                onStop={() => { simAllAbortRef.current = true; }}
                totalSessions={totalSessions}
                simulatedSessions={simulatedSessions}
            />

            <PlayerCard
                driver={driver}
                team={team}
                teamBorder={TEAM_STYLE[team.name] || "border-f1-border"}
                playerPoints={playerPoints}
                playerStats={playerStats}
                prevPlayerStats={prevPlayerStats}
                isBusy={isBusy}
                driversBoard={driversBoard}
                wdcLoading={wdcLoading}
                onReset={resetSeason}
                onOpenWdc={openWdc}
            />

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
