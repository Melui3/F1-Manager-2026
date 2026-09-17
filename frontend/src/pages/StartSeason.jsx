import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";
import { SESSION_LABEL } from "../data/labels";
import SessionResultsModal from "../components/modals/SessionResultsModal";
import RaceCalendar from "../components/season/RaceCalendar";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/modals/ConfirmModal";

function fmtBudget(value) {
    const millions = (Number(value) || 0) / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
}

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


async function loadSeasonData() {
    const [calendar, board, budget, live] = await Promise.all([
        apiFetch("/api/season/calendar/"),
        apiFetch("/api/drivers/"),
        apiFetch("/api/season/budget/"),
        apiFetch("/api/live-race/"),
    ]);
    return { calendar, board, budget: budget.budget, liveRace: live.race };
}

export default function StartSeason() {
    const { team, driver, sim, setDriver, setSim, activeSessionId } = useGame();
    const navigate = useNavigate();
    const season = sim?.season ?? 2026;
    const [data, setData] = useState({ calendar: [], board: [], budget: 0, liveRace: null });
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState(null);
    const [resultSession, setResultSession] = useState(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const playerRow = data.board.find((row) => isSameDriver(row, driver));
    const playerRank = data.board.findIndex((row) => isSameDriver(row, driver)) + 1;
    const champion = useMemo(() => [...data.board].sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (b.wins ?? 0) - (a.wins ?? 0))[0] ?? null, [data.board]);
    const recap = useMemo(() => buildSessionRecap(resultSession?.results, driver, resultSession), [resultSession, driver]);
    const playerStats = playerRow ? {
        ...playerRow,
        street: playerRow.street_circuit_affinity,
        high: playerRow.high_speed_circuit_affinity,
        wet: playerRow.wet_circuit_affinity,
    } : null;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setResultSession(null);
        setConfirmReset(false);
        loadSeasonData().then((next) => {
            if (!cancelled) setData(next);
        }).catch((cause) => {
            if (!cancelled) setError(cause.message || "Erreur lors du chargement");
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [activeSessionId]);

    async function resetSeason() {
        try {
            setResetting(true);
            setError(null);
            const res = await apiFetch("/api/season/reset/", {
                method: "POST",
                body: JSON.stringify({ full: true, advanceSeason: false, keepSeason: true }),
            });
            const next = await loadSeasonData();
            setData(next);
            const resetDriver = next.board.find((row) => isSameDriver(row, driver));
            if (resetDriver) setDriver(resetDriver);
            setSim((previous) => ({
                ...previous,
                season: res?.season ?? season,
                currentRound: 0,
                lastResults: null,
                standings: null,
            }));
            setResultSession(null);
            setConfirmReset(false);
        } catch (cause) {
            setError(cause.message || "Erreur de remise à zéro");
        } finally {
            setResetting(false);
        }
    }

    if (!team || !driver) return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
                <h1 className="font-f1-display text-2xl font-bold mb-2">Team ou pilote manquant</h1>
                <p className="text-f1-silver">Retourne choisir une team puis un pilote.</p>
                <Button className="mt-4" onClick={() => navigate("/choose-team")}>Refaire les choix</Button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col">
            <RaceCalendar
                calendar={data.calendar} liveRace={data.liveRace} driver={driver} team={team}
                season={season} budget={data.budget} playerRank={playerRank} playerPoints={playerRow?.points ?? 0}
                loading={loading} error={error} champion={champion}
                onReset={() => setConfirmReset(true)} onStandings={() => navigate("/standings")}
                onResults={setResultSession}
            />
            <SessionResultsModal
                open={Boolean(resultSession)} onClose={() => setResultSession(null)}
                results={resultSession?.results ?? []} player={driver} sessionMeta={resultSession}
                playerStats={playerStats} prevPlayerStats={null}
                summary={recap} events={recap.events} budgetAward={null}
            />
            <ConfirmModal
                open={confirmReset} title="Reset de la saison" danger confirmLabel="Reset saison"
                loading={resetting} onClose={() => setConfirmReset(false)} onConfirm={resetSeason}
            >
                Tu vas remettre la saison {season} a zero pour cette session locale. Le calendrier,
                les resultats, le budget et la progression sportive seront reinitialises.
            </ConfirmModal>
        </div>
    );
}
