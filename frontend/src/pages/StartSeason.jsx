import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../services/api";
import { SESSION_LABEL } from "../data/labels";
import SessionResultsModal from "../components/modals/SessionResultsModal";
import WdcModal from "../components/modals/WdcModal";
import CalendarSection from "../components/season/CalendarSection";
import PlayerCard from "../components/season/PlayerCard";
import ChampionStage from "../components/season/ChampionStage";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/modals/ConfirmModal";

// ─── Budget award tables ──────────────────────────────────────────────────────

const GP_BUDGET     = [5,4,3.5,3,2.5,2.2,2,1.8,1.6,1.4,1.2,1,0.9,0.8,0.7,0.6,0.5,0.5,0.4,0.4,0.3,0.3];
const SPRINT_BUDGET = [2,1.5,1.2,1,0.8,0.7,0.6,0.5,0.5,0.4,0.4,0.3,0.3,0.3,0.2,0.2,0.2,0.2,0.2,0.1,0.1,0.1];

function earnedBudget(position, sessionType) {
    const table = sessionType === "GP" ? GP_BUDGET : SPRINT_BUDGET;
    const idx = Math.max(0, (position || 22) - 1);
    return (table[idx] ?? 1) * 1_000_000;
}

function fmtBudget(value) {
    const millions = (Number(value) || 0) / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
}

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

function buildSessionRecap(results, player, meta, earned = 0) {
    const sorted = Array.isArray(results)
        ? [...results].sort((a, b) => (a?.position ?? 999) - (b?.position ?? 999))
        : [];
    const winner = sorted[0] || null;
    const playerResult = sorted.find((r) => isSameDriver(r, player)) || null;
    const topThree = sorted.slice(0, 3);
    const sessionLabel = SESSION_LABEL[meta?.session_type] ?? meta?.session_type ?? "Session";
    const isRace = meta?.session_type === "GP" || meta?.session_type === "S";

    const events = [];
    if (winner) {
        events.push(`${winner.surname} remporte ${sessionLabel} devant ${topThree[1]?.surname ?? "le peloton"}.`);
    }
    if (playerResult?.position) {
        events.push(`${player?.surname ?? "Ton pilote"} termine P${playerResult.position}${earned ? ` et rapporte ${fmtBudget(earned)}` : ""}.`);
    }
    if (topThree.length >= 3) {
        events.push(`Podium: ${topThree.map((r) => `${r.position}. ${r.surname}`).join(" / ")}.`);
    }
    if (!isRace && playerResult?.stats_gained) {
        events.push(`Travail utile: +${playerResult.stats_gained} progression sur cette session.`);
    }

    return {
        title: winner ? `${winner.surname} en tete` : "Session terminee",
        playerPosition: playerResult?.position ?? null,
        winner,
        topThree,
        isRace,
        events,
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StartSeason() {
    const { team, driver, sim, setDriver, setSim } = useGame();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const season = sim?.season ?? 2026;

    const [expandedGp, setExpandedGp] = useState(null);
    const [calendar, setCalendar] = useState([]);
    const [driversBoard, setDriversBoard] = useState([]);
    const [budget, setBudget] = useState(0);

    const [loading, setLoading] = useState(true);
    const [simLoading, setSimLoading] = useState(false);
    const [error, setError] = useState(null);

    const [lastResults, setLastResults] = useState([]);
    const [lastSessionMeta, setLastSessionMeta] = useState(null);
    const [lastEvents, setLastEvents] = useState([]);
    const [lastSummary, setLastSummary] = useState(null);
    const [lastBudgetAward, setLastBudgetAward] = useState(null);

    const [prevPlayerStats, setPrevPlayerStats] = useState(null);
    const [playerStats, setPlayerStats] = useState(null);

    const [activeModal, setActiveModal] = useState(null);

    const [wdcBoard, setWdcBoard] = useState([]);
    const [wdcLoading, setWdcLoading] = useState(false);
    const [wdcError, setWdcError] = useState(null);

    const [simAllLoading, setSimAllLoading] = useState(false);
    const [simAllProgress, setSimAllProgress] = useState({ done: 0, total: 0 });
    const simAllAbortRef = useRef(false);

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

    const playerRank = useMemo(
        () => driversBoard.findIndex((d) => isSameDriver(d, driver)) + 1,
        [driversBoard, driver]
    );

    const teammate = useMemo(
        () => driversBoard.find((d) => d?.team === team?.name && !isSameDriver(d, driver)) || null,
        [driversBoard, team?.name, driver]
    );

    const teammateRank = useMemo(
        () => teammate ? driversBoard.findIndex((d) => isSameDriver(d, teammate)) + 1 : null,
        [driversBoard, teammate]
    );

    const currentChampion = useMemo(() => {
        if (!driversBoard.length) return null;
        return [...driversBoard].sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (b.wins ?? 0) - (a.wins ?? 0))[0] || null;
    }, [driversBoard]);

    const dynamicObjectives = useMemo(() => {
        const list = [];
        const nextLabel = nextSession
            ? `${nextSession.gp_name} - ${SESSION_LABEL[nextSession.session_type] ?? nextSession.session_type}`
            : "Saison terminee";

        list.push({
            label: "Prochain objectif",
            value: nextSession ? `Top 10 sur ${nextLabel}` : "Toutes les sessions sont terminees",
            done: !nextSession,
        });

        if (teammate) {
            list.push({
                label: "Duel interne",
                value: teammateRank && playerRank
                    ? `${driver?.surname} P${playerRank} vs ${teammate.surname} P${teammateRank}`
                    : `Battre ${teammate.surname}`,
                done: !!playerRank && !!teammateRank && playerRank > 0 && playerRank < teammateRank,
            });
        }

        list.push({
            label: "Tresorerie",
            value: `${fmtBudget(budget)} disponibles`,
            done: (budget || 0) >= 12_000_000,
        });

        return list;
    }, [nextSession, teammate, teammateRank, playerRank, driver?.surname, budget]);

    const isBusy = simLoading || simAllLoading;

    // ── Effects ────────────────────────────────────────────────────────────────

    async function refreshAll() {
        const [cal, board, budgetRes] = await Promise.all([
            apiFetch("/api/season/calendar/"),
            apiFetch("/api/drivers/"),
            apiFetch("/api/season/budget/"),
        ]);
        const nextCalendarData = Array.isArray(cal) ? cal : [];
        const nextBoardData = Array.isArray(board) ? board : [];
        const nextBudget = budgetRes?.budget ?? 0;

        setCalendar(nextCalendarData);
        setDriversBoard(nextBoardData);
        setBudget(nextBudget);

        return { calendar: nextCalendarData, board: nextBoardData, budget: nextBudget };
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

    const sameDriver = isSameDriver;

    const applyBudgetAward = async (results, meta, notify = false) => {
        const sType = meta?.session_type;
        const isRace = sType === "GP" || sType === "S";
        const playerResult = results.find((r) => sameDriver(r, driver)) || null;

        if (!isRace || !playerResult?.position) {
            return { earned: 0, playerResult };
        }

        const earned = earnedBudget(playerResult.position, sType);
        await apiFetch("/api/season/budget/award/", {
            method: "POST",
            body: JSON.stringify({ amount: earned }),
        });

        if (notify) {
            addToast({
                message: `P${playerResult.position} · +${fmtBudget(earned)} budget`,
                type: playerResult.position <= 3 ? "success" : "info",
                duration: 5000,
            });
        }

        return { earned, playerResult };
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

            const sType = meta?.session_type;
            const isRace = sType === "GP" || sType === "S";
            const award = await applyBudgetAward(results, meta, isRace);
            const recap = buildSessionRecap(results, driver, meta, award.earned);

            setLastBudgetAward(award);
            setLastSummary(recap);
            setLastEvents(recap.events);

            const fresh = await refreshAll();
            const isSeasonNowDone = fresh.calendar.length > 0 && fresh.calendar.every((s) => !!s.is_simulated);

            if (isSeasonNowDone) {
                setWdcBoard(fresh.board);
                setWdcError(null);
                setActiveModal("wdc");
            } else if (isRace) {
                setActiveModal("session");
            } else {
                // Toast for FP/Quali
                const label = SESSION_LABEL[sType] ?? sType;
                if (sType === "FP") {
                    addToast({ message: `${label} terminé — stats améliorées`, type: "info" });
                } else {
                    const pos = award.playerResult?.position;
                    const posText = pos ? `P${pos}` : "—";
                    addToast({
                        message: `${label} · ${driver?.surname ?? ""} : ${posText}`,
                        type: pos && pos <= 3 ? "success" : "info",
                    });
                }
            }
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
        const award = await applyBudgetAward(results, meta, false);
        const recap = buildSessionRecap(results, driver, meta, award.earned);

        setLastResults(results);
        setLastBudgetAward(award);
        setLastSummary(recap);
        setLastEvents(recap.events);

        await refreshAll();

        return { results, meta, award, recap };
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
            let totalEarned = 0;

            for (let i = 0; i < remaining.length; i++) {
                if (simAllAbortRef.current) break;
                if (playerStats) setPrevPlayerStats(playerStats);
                const s = remaining[i];
                const outcome = await simulateOneSilent(s.index, force, s);
                totalEarned += outcome?.award?.earned || 0;
                setSimAllProgress({ done: i + 1, total: remaining.length });
            }

            if (totalEarned > 0) {
                addToast({
                    message: `Simulation terminee · +${fmtBudget(totalEarned)} budget`,
                    type: "success",
                    duration: 5500,
                });
            }
            const latestCalendar = await apiFetch("/api/season/calendar/");
            const latestBoard = await apiFetch("/api/drivers/");
            const finished = Array.isArray(latestCalendar) && latestCalendar.length > 0 && latestCalendar.every((s) => !!s.is_simulated);
            if (finished) {
                setCalendar(latestCalendar);
                setDriversBoard(Array.isArray(latestBoard) ? latestBoard : []);
                setWdcBoard(Array.isArray(latestBoard) ? latestBoard : []);
                setWdcError(null);
                setActiveModal("wdc");
            } else {
                setActiveModal("session");
            }
        } catch (e) {
            console.error(e);
            setError(e?.message || "Erreur simulation totale");
        } finally {
            setSimAllLoading(false);
        }
    };

    const simulateGp = async (gpName) => {
        const gpSessions = flatSessions.filter((s) => s?.gp_name === gpName && !s?.is_simulated);
        if (!gpSessions.length) return;

        try {
            simAllAbortRef.current = false;
            setSimAllLoading(true);
            setError(null);
            setSimAllProgress({ done: 0, total: gpSessions.length });
            setActiveModal(null);
            let totalEarned = 0;

            for (let i = 0; i < gpSessions.length; i++) {
                if (simAllAbortRef.current) break;
                if (playerStats) setPrevPlayerStats(playerStats);
                const s = gpSessions[i];
                const outcome = await simulateOneSilent(s.index, false, s);
                totalEarned += outcome?.award?.earned || 0;
                setSimAllProgress({ done: i + 1, total: gpSessions.length });
            }

            if (totalEarned > 0) {
                addToast({
                    message: `${gpName} termine · +${fmtBudget(totalEarned)} budget`,
                    type: "success",
                    duration: 5500,
                });
            }
            const latestCalendar = await apiFetch("/api/season/calendar/");
            const latestBoard = await apiFetch("/api/drivers/");
            const finished = Array.isArray(latestCalendar) && latestCalendar.length > 0 && latestCalendar.every((s) => !!s.is_simulated);
            if (finished) {
                setCalendar(latestCalendar);
                setDriversBoard(Array.isArray(latestBoard) ? latestBoard : []);
                setWdcBoard(Array.isArray(latestBoard) ? latestBoard : []);
                setWdcError(null);
                setActiveModal("wdc");
            } else {
                setActiveModal("session");
            }
        } catch (e) {
            console.error(e);
            setError(e?.message || "Erreur simulation GP");
        } finally {
            setSimAllLoading(false);
        }
    };

    const resetSeason = async () => {
        try {
            setSimLoading(true);
            setError(null);

            const res = await apiFetch("/api/season/reset/", {
                method: "POST",
                body: JSON.stringify({ full: true, advanceSeason: false, keepSeason: true }),
            });

            setCalendar([]);
            setDriversBoard([]);
            setLastResults([]);
            setLastEvents([]);
            setLastSummary(null);
            setLastBudgetAward(null);
            setExpandedGp(null);
            setPrevPlayerStats(null);
            setPlayerStats(null);
            setActiveModal(null);
            setLastSessionMeta(null);
            setWdcBoard([]);
            setWdcError(null);

            const refreshed = await refreshAll();
            const resetDriver = refreshed?.board?.find((d) => isSameDriver(d, driver));
            if (resetDriver) setDriver(resetDriver);
            setSim((prev) => ({
                ...(prev || {}),
                season: res?.season ?? season,
                currentRound: 0,
                lastResults: null,
                standings: null,
            }));
        } catch (e) {
            console.error(e);
            setError(e?.message || "Erreur reset");
        } finally {
            setSimLoading(false);
        }
    };

    const toggleGp = (gpName) => setExpandedGp((cur) => (cur === gpName ? null : gpName));

    // ── Render ─────────────────────────────────────────────────────────────────

    if (!team || !driver) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="font-f1-display text-2xl font-bold mb-2">Team ou pilote manquant</h1>
                    <p className="text-f1-silver">Retourne choisir une team puis un pilote.</p>
                    <Button className="mt-4" onClick={() => navigate("/choose-team")}>
                        Refaire les choix
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {seasonDone && (
                <div className="w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
                    <div className="relative">
                        <ChampionStage champion={currentChampion} player={driver} season={season} compact />
                        <div className="mt-3 flex justify-end">
                            <Button onClick={() => navigate("/end-of-season")} size="lg">
                                Voir la saison suivante
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
                onSimulateGp={simulateGp}
                onStop={() => { simAllAbortRef.current = true; }}
                totalSessions={totalSessions}
                simulatedSessions={simulatedSessions}
                season={season}
                objectives={dynamicObjectives}
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
                onReset={() => setActiveModal("reset-season")}
                onOpenWdc={openWdc}
                budget={budget}
            />

            <SessionResultsModal
                open={activeModal === "session"}
                onClose={() => setActiveModal(null)}
                results={lastResults}
                player={driver}
                sessionMeta={lastSessionMeta}
                playerStats={playerStats}
                prevPlayerStats={prevPlayerStats}
                summary={lastSummary}
                events={lastEvents}
                budgetAward={lastBudgetAward}
            />

            <WdcModal
                open={activeModal === "wdc"}
                onClose={() => setActiveModal(null)}
                board={wdcBoard}
                player={driver}
                season={season}
                loading={wdcLoading}
                error={wdcError}
                onReload={openWdc}
            />

            <ConfirmModal
                open={activeModal === "reset-season"}
                title="Reset de la saison"
                danger
                confirmLabel="Reset saison"
                loading={simLoading}
                onClose={() => setActiveModal(null)}
                onConfirm={resetSeason}
            >
                Tu vas remettre la saison {season} a zero pour cette session locale. Le calendrier,
                les resultats, le budget et la progression sportive seront reinitialises.
            </ConfirmModal>
            </div>
        </div>
    );
}
