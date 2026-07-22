import { useMemo } from "react";
import Modal from "./Modal";
import { PODIUM_STYLE, TEAM_COLOR } from "../../data/labels";
import FlagBadge from "../ui/FlagBadge";
import ChampionStage from "../season/ChampionStage";

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

function DriverRow({ d, rank, isPlayer }) {
    const podium = PODIUM_STYLE[rank];
    const teamColor = TEAM_COLOR[d?.team];

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
            {d?.country && <FlagBadge country={d.country} compact />}

            {/* Team dot */}
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${teamColor?.dot ?? "bg-f1-muted"}`} />

            {/* Name */}
            <div className="flex-1 min-w-0">
                <span className={`font-semibold truncate ${isPlayer ? "text-f1-white" : podium ? podium.text : "text-f1-white"}`}>
                    {d?.name} <span className="uppercase">{d?.surname}</span>
                </span>
                <span className="text-f1-muted text-xs ml-2">{d?.team}</span>
                {isPlayer && (
                    <span className="ml-2 text-[10px] font-bold text-f1-red bg-f1-red/15 px-1.5 py-0.5 rounded-full">TOI</span>
                )}
            </div>

            {/* Points */}
            <div className="shrink-0 text-right">
                <span className="font-f1-display font-bold text-f1-white tabular-nums">
                    {Number(d?.points ?? 0)}
                </span>
                <span className="text-f1-muted text-xs ml-1">pts</span>
            </div>
        </div>
    );
}

export default function WdcModal({ open, onClose, board, player, season = null, loading = false, error = null, onReload }) {
    const sorted = useMemo(() => {
        const arr = Array.isArray(board) ? [...board] : [];
        arr.sort((a, b) => {
            const pa = Number(a?.points ?? 0);
            const pb = Number(b?.points ?? 0);
            const wa = Number(a?.wins ?? 0);
            const wb = Number(b?.wins ?? 0);
            const pda = Number(a?.podiums ?? 0);
            const pdb = Number(b?.podiums ?? 0);
            if (pb !== pa) return pb - pa;
            if (wb !== wa) return wb - wa;
            return pdb - pda;
        });
        return arr;
    }, [board]);

    const champion = sorted[0] || null;

    if (!open) return null;

    return (
        <Modal
            open={open}
            title="WDC — Classement final"
            onClose={onClose}
            maxWidth="max-w-4xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <button
                        className="px-4 py-2 rounded-xl bg-f1-surface-2 hover:bg-f1-border font-semibold text-f1-white border border-f1-border text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-f1"
                        onClick={onReload}
                        disabled={loading || !onReload}
                    >
                        {loading && <span className="f1-spinner h-4 w-4" />}
                        Recharger
                    </button>

                    <button
                        className="px-5 py-2 rounded-xl bg-f1-red hover:bg-f1-red-dark font-semibold text-white text-sm transition-colors font-f1"
                        onClick={onClose}
                    >
                        OK
                    </button>
                </div>
            }
        >
            {loading ? (
                <div className="flex items-center gap-3 text-f1-silver py-8 justify-center">
                    <span className="f1-spinner" />
                    <div>
                        <div className="font-semibold text-f1-white">Chargement du classement…</div>
                        <div className="text-sm text-f1-muted">On récupère les données des pilotes.</div>
                    </div>
                </div>
            ) : error ? (
                <div className="rounded-xl border border-f1-red/40 bg-f1-red/5 p-4 text-sm">
                    <div className="font-bold text-f1-white mb-1">Erreur</div>
                    <div className="text-f1-silver">{error}</div>
                    <div className="text-f1-muted text-xs mt-2">Clique "Recharger". Si ça persiste, la session locale n'a peut-être pas encore de données valides.</div>
                </div>
            ) : sorted.length === 0 ? (
                <div className="text-f1-silver text-sm">
                    <div className="font-bold mb-1 text-f1-white">Aucun pilote reçu.</div>
                    <div>Aucun classement n'est encore disponible dans cette session. Simule une course ou clique "Recharger" pour retenter.</div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {champion && <ChampionStage champion={champion} player={player} season={season} compact />}

                    {/* Full standings */}
                    <div className="flex flex-col gap-1.5">
                        {sorted.map((d, idx) => (
                            <DriverRow
                                key={`${d?.surname ?? "x"}_${d?.number ?? idx}_${idx + 1}`}
                                d={d}
                                rank={idx + 1}
                                isPlayer={player ? isSameDriver(d, player) : false}
                            />
                        ))}
                    </div>

                    <div className="text-xs text-f1-muted text-right">Tie-break : points → victoires → podiums</div>
                </div>
            )}
        </Modal>
    );
}
