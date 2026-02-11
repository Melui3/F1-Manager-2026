import React, { useMemo } from "react";
import Modal from "./Modal";

const clean = (s) =>
    String(s ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

export default function WdcModal({ open, onClose, board, player }) {
    const rows = useMemo(() => {
        const arr = Array.isArray(board) ? [...board] : [];
        // tri safe : points desc, wins desc, puis nom
        arr.sort((a, b) => {
            const pa = Number(a?.points ?? 0);
            const pb = Number(b?.points ?? 0);
            if (pb !== pa) return pb - pa;

            const wa = Number(a?.wins ?? 0);
            const wb = Number(b?.wins ?? 0);
            if (wb !== wa) return wb - wa;

            const na = clean(`${a?.surname ?? ""}${a?.name ?? ""}`);
            const nb = clean(`${b?.surname ?? ""}${b?.name ?? ""}`);
            return na.localeCompare(nb);
        });
        return arr;
    }, [board]);

    const champion = rows[0] || null;

    const playerRow = useMemo(() => {
        if (!player) return null;

        // priorité id
        const pid = player?.id;
        if (pid != null) {
            const found = rows.find((r) => String(r?.id) === String(pid));
            if (found) return found;
        }

        // fallback surname+number
        const ps = clean(player?.surname);
        const pn = String(player?.number ?? "");
        return rows.find((r) => clean(r?.surname) === ps && String(r?.number ?? "") === pn) || null;
    }, [rows, player]);

    const playerPos = useMemo(() => {
        if (!playerRow) return null;
        const idx = rows.findIndex((r) => (r?.id != null && playerRow?.id != null ? String(r.id) === String(playerRow.id) : r === playerRow));
        return idx >= 0 ? idx + 1 : null;
    }, [rows, playerRow]);

    return (
        <Modal
            open={open}
            title="WDC — Classement pilotes"
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
            {rows.length === 0 ? (
                <div className="text-gray-300">Aucune donnée WDC (leaderboard vide).</div>
            ) : (
                <>
                    {/* Champion */}
                    {champion && (
                        <div className="mb-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                            <div className="text-xs text-yellow-200/80">Champion provisoire</div>
                            <div className="mt-1 text-lg font-extrabold text-white">
                                1. {champion.name} {champion.surname}
                            </div>
                            <div className="text-sm text-gray-200">
                                {champion.team} • <span className="font-black">{champion.points} pts</span>
                            </div>
                        </div>
                    )}

                    {/* Ton rang */}
                    {playerRow && (
                        <div className="mb-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                            <div className="text-xs text-sky-200/80">Ton rang</div>
                            <div className="mt-1 text-white font-bold">
                                {playerPos}. {playerRow.name} {playerRow.surname}{" "}
                                <span className="text-gray-400">({playerRow.team})</span>
                            </div>
                            <div className="text-sm text-gray-200">
                                <span className="font-black">{playerRow.points} pts</span> • {playerRow.wins ?? 0} win(s)
                            </div>
                        </div>
                    )}

                    {/* Top 10 */}
                    <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-4">
                        <div className="font-extrabold text-white mb-3">Top 10</div>

                        <div className="flex flex-col gap-2">
                            {rows.slice(0, 10).map((r, idx) => {
                                const isPlayer =
                                    playerRow?.id != null && r?.id != null
                                        ? String(playerRow.id) === String(r.id)
                                        : clean(playerRow?.surname) === clean(r?.surname) && String(playerRow?.number ?? "") === String(r?.number ?? "");

                                return (
                                    <div
                                        key={`${r.id ?? `${r.surname}_${r.number}`}-${idx}`}
                                        className={`flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 px-3 py-2 ${
                                            isPlayer ? "ring-2 ring-sky-500/40" : ""
                                        }`}
                                    >
                                        <div className="text-sm text-gray-200">
                                            <span className="font-bold">{idx + 1}.</span> {r.name} {r.surname}{" "}
                                            <span className="text-gray-500">({r.team})</span>
                                        </div>
                                        <div className="text-sm text-gray-200 font-semibold whitespace-nowrap">
                                            {r.points} pts
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
}