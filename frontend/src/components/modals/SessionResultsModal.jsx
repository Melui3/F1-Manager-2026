import React, { useMemo } from "react";
import Modal from "./Modal";

const norm = (s) => String(s ?? "").trim().toLowerCase();

// ===== UI stats (duplication volontaire pour avoir 2 fichiers seulement) =====
function StatCell({ label, value, delta }) {
    const d = typeof delta === "number" ? delta : null;
    const deltaTxt = d === null ? null : d > 0 ? `+${d}` : `${d}`;

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-2">
            <div className="text-[11px] text-gray-400">{label}</div>
            <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm font-extrabold text-white">{value ?? "—"}</div>
                {deltaTxt !== null && deltaTxt !== "0" && (
                    <div className={`text-xs font-bold ${d > 0 ? "text-green-400" : "text-red-400"}`}>
                        {deltaTxt}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatsGrid({ stats, prevStats }) {
    if (!stats) return <div className="text-sm text-gray-300">Stats indisponibles.</div>;

    const delta = (k) =>
        typeof stats?.[k] === "number" && typeof prevStats?.[k] === "number"
            ? stats[k] - prevStats[k]
            : null;

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

export default function SessionResultsModal({
                                                open,
                                                onClose,
                                                results,
                                                player,
                                                sessionMeta,
                                                playerStats,
                                                prevPlayerStats,
                                            }) {
    const safeResults = Array.isArray(results) ? results : [];

    const title = sessionMeta
        ? `${sessionMeta.gp_name} — ${sessionMeta.session_type} (${sessionMeta.date ?? "—"})`
        : "Résultats de session";

    const sorted = useMemo(() => {
        const arr = [...safeResults];
        arr.sort((a, b) => (a?.position ?? 999) - (b?.position ?? 999));
        return arr;
    }, [safeResults]);

    const playerKey = `${norm(player?.surname)}_${player?.number}`;

    const playerRow = useMemo(() => {
        return sorted.find((r) => `${norm(r?.surname)}_${r?.number}` === playerKey) || null;
    }, [sorted, playerKey]);

    return (
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            footer={
                <div className="flex justify-end">
                    <button
                        className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold text-white"
                        onClick={onClose}
                    >
                        OK
                    </button>
                </div>
            }
        >
            {/* Stats pilote dans la modal */}
            <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-4 mb-4">
                <div className="text-xs text-gray-400 mb-2">Stats pilote</div>
                <StatsGrid stats={playerStats} prevStats={prevPlayerStats} />
            </div>

            {/* Ton résultat */}
            <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-4 mb-4">
                <div className="text-xs text-gray-400">Ton résultat</div>

                {playerRow ? (
                    <div className="mt-2 flex items-center justify-between gap-4">
                        <div className="font-bold text-white">
                            {playerRow.position}. {playerRow.name} {playerRow.surname}{" "}
                            <span className="text-gray-400">({playerRow.team})</span>
                        </div>
                        <div className="text-white font-black whitespace-nowrap">
                            +{playerRow.points_gained ?? 0} pts
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-gray-300">Pas trouvé dans les résultats (check surname/number côté backend).</div>
                )}
            </div>

            {/* Top 10 */}
            <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-4">
                <div className="font-extrabold text-white mb-3">Classement (Top 10)</div>

                {sorted.length === 0 ? (
                    <div className="text-gray-300">Aucun résultat reçu.</div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {sorted.slice(0, 10).map((r) => (
                            <div
                                key={`${r.position}-${r.surname}-${r.number}`}
                                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 px-3 py-2"
                            >
                                <div className="text-sm text-gray-200">
                                    <span className="font-bold">{r.position}.</span> {r.name} {r.surname}{" "}
                                    <span className="text-gray-500">({r.team})</span>
                                </div>

                                <div className="text-sm text-gray-200 font-semibold whitespace-nowrap">
                                    +{r.points_gained ?? 0} pts
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}