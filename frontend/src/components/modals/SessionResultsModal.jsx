import { useMemo } from "react";
import Modal from "./Modal";
import { SESSION_LABEL, COUNTRY_FLAG, PODIUM_STYLE, TEAM_COLOR } from "../../data/labels";

const clean = (s) =>
    String(s ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "");

const num = (x) => {
    const n = Number(String(x ?? "").trim());
    return Number.isFinite(n) ? n : null;
};

const sameDriver = (row, player) => {
    if (!row || !player) return false;

    const rowId = row?.id ?? row?.driver_id;
    const playerId = player?.id;
    if (rowId != null && playerId != null) {
        return String(rowId) === String(playerId);
    }

    const rowSurname = clean(row?.surname);
    const playerSurname = clean(player?.surname);
    const rowNum = num(row?.number);
    const playerNum = num(player?.number);

    return !!rowSurname && !!playerSurname && rowSurname === playerSurname && rowNum !== null && rowNum === playerNum;
};

function flag(country) {
    return COUNTRY_FLAG[country] ?? "";
}

// ─── Stats grid ───────────────────────────────────────────────────────────────

function StatCell({ label, value, delta }) {
    const d = typeof delta === "number" ? delta : null;
    const deltaTxt = d === null ? null : d > 0 ? `+${d}` : `${d}`;

    return (
        <div className="rounded-xl border border-f1-border bg-f1-dark/40 p-2.5">
            <div className="text-[10px] text-f1-muted uppercase tracking-wider mb-1">{label}</div>
            <div className="flex items-baseline justify-between gap-2">
                <div className="font-f1-display text-sm font-bold text-f1-white">{value ?? "—"}</div>
                {deltaTxt !== null && deltaTxt !== "0" && (
                    <div className={`text-xs font-bold ${d > 0 ? "text-emerald-400" : "text-f1-red"}`}>
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
        typeof stats?.[k] === "number" && typeof prevStats?.[k] === "number"
            ? stats[k] - prevStats[k]
            : null;

    return (
        <div className="grid grid-cols-3 gap-2">
            <StatCell label="Speed"       value={stats.speed}       delta={delta("speed")}       />
            <StatCell label="Racing"      value={stats.racing}      delta={delta("racing")}      />
            <StatCell label="Reaction"    value={stats.reaction}    delta={delta("reaction")}    />
            <StatCell label="Experience"  value={stats.experience}  delta={delta("experience")}  />
            <StatCell label="Consistency" value={stats.consistency} delta={delta("consistency")} />
            <StatCell label="Error rate"  value={stats.error_rate}  delta={delta("error_rate")}  />
            <StatCell label="Street"      value={stats.street}      delta={delta("street")}      />
            <StatCell label="High speed"  value={stats.high}        delta={delta("high")}        />
            <StatCell label="Wet"         value={stats.wet}         delta={delta("wet")}         />
        </div>
    );
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({ r, isPlayer }) {
    const rank = r.position;
    const podium = PODIUM_STYLE[rank];
    const teamColor = TEAM_COLOR[r.team];

    return (
        <div
            className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-colors",
                isPlayer
                    ? "border-f1-red/40 bg-f1-red/5 font-semibold"
                    : podium
                        ? `${podium.ring} font-medium`
                        : "border-f1-border bg-f1-dark/30",
            ].join(" ")}
        >
            {/* Rank */}
            {podium ? (
                <span className={`font-f1-display text-sm font-bold w-6 text-center ${podium.text}`}>
                    {podium.rank}
                </span>
            ) : (
                <span className="font-f1-display text-sm font-bold text-f1-silver w-6 text-center">{rank}</span>
            )}

            {/* Flag */}
            {r.country && <span className="text-base">{flag(r.country)}</span>}

            {/* Team color dot */}
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${teamColor?.dot ?? "bg-f1-muted"}`} />

            {/* Name */}
            <div className="flex-1 min-w-0">
                <span className={`font-semibold truncate ${isPlayer ? "text-f1-white" : podium ? podium.text : "text-f1-white"}`}>
                    {r.name} <span className="uppercase">{r.surname}</span>
                </span>
                <span className="text-f1-muted text-xs ml-2 truncate">{r.team}</span>
                {isPlayer && (
                    <span className="ml-2 text-[10px] font-bold text-f1-red bg-f1-red/15 px-1.5 py-0.5 rounded-full">TOI</span>
                )}
            </div>

            {/* Points */}
            <div className="shrink-0 text-right">
                <span className="font-f1-display font-bold text-f1-white tabular-nums">
                    +{r.points_gained ?? 0}
                </span>
                <span className="text-f1-muted text-xs ml-1">pts</span>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

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

    const sessionLabel = sessionMeta?.session_type
        ? (SESSION_LABEL[sessionMeta.session_type] ?? sessionMeta.session_type)
        : null;

    const title = sessionMeta
        ? `${sessionMeta.gp_name} — ${sessionLabel ?? sessionMeta.session_type}`
        : "Résultats de session";

    const sorted = useMemo(() => {
        const arr = [...safeResults];
        const hasPos = arr.some((r) => r?.position != null);
        if (!hasPos) return arr.map((r, idx) => ({ ...r, position: idx + 1 }));
        arr.sort((a, b) => (a?.position ?? 999) - (b?.position ?? 999));
        return arr;
    }, [safeResults]);

    const playerRow = useMemo(
        () => sorted.find((r) => sameDriver(r, player)) || null,
        [sorted, player]
    );

    const podiumStyle = playerRow ? PODIUM_STYLE[playerRow.position] : null;

    return (
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            footer={
                <div className="flex justify-end">
                    <button
                        className="px-5 py-2 rounded-xl bg-f1-red hover:bg-f1-red-dark font-semibold text-white text-sm transition-colors font-f1"
                        onClick={onClose}
                    >
                        OK
                    </button>
                </div>
            }
        >
            {/* Ton résultat */}
            {playerRow && (
                <div className={`rounded-xl border p-4 mb-4 ${podiumStyle ? podiumStyle.ring : "border-f1-red/40 bg-f1-red/5"}`}>
                    <div className="text-[10px] text-f1-muted uppercase tracking-wider mb-2">Ton résultat</div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            {podiumStyle ? (
                                <span className={`font-f1-display text-2xl font-bold ${podiumStyle.text}`}>
                                    {podiumStyle.rank}
                                </span>
                            ) : (
                                <span className="font-f1-display text-2xl font-bold text-f1-white">
                                    P{playerRow.position}
                                </span>
                            )}
                            <div>
                                <div className="font-bold text-f1-white">
                                    {playerRow.name} <span className="uppercase">{playerRow.surname}</span>
                                </div>
                                <div className="text-f1-muted text-xs">{playerRow.team}</div>
                            </div>
                        </div>
                        <div className="font-f1-display font-bold text-xl text-f1-white whitespace-nowrap">
                            +{playerRow.points_gained ?? 0}
                            <span className="text-f1-muted text-sm font-normal ml-1">pts</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats pilote */}
            <div className="rounded-xl border border-f1-border bg-f1-dark/40 p-4 mb-4">
                <div className="text-[10px] text-f1-muted uppercase tracking-wider mb-3">Stats pilote</div>
                <StatsGrid stats={playerStats} prevStats={prevPlayerStats} />
            </div>

            {/* Top 10 */}
            <div className="rounded-xl border border-f1-border bg-f1-dark/30 p-4">
                <div className="font-f1-display font-bold text-f1-white text-sm mb-3 uppercase tracking-wide">
                    Classement — Top 10
                </div>

                {sorted.length === 0 ? (
                    <div className="text-f1-silver text-sm">Aucun résultat reçu.</div>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {sorted.slice(0, 10).map((r) => (
                            <ResultRow
                                key={`${r.position}-${r.surname}-${r.number}-${r.id ?? "x"}`}
                                r={r}
                                isPlayer={sameDriver(r, player)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
