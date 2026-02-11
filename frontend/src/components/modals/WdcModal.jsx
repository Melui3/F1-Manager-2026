import React, { useMemo } from "react";
import Modal from "./Modal";

// helpers robustes (même logique que StartSeason)
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

export default function WdcModal({ open, onClose, board, player }) {
    console.log("WDC open:", open);
    console.log("WDC board:", board);
    console.log("WDC board length:", Array.isArray(board) ? board.length : "not array");

    if (!open) return null;

    const safeBoard = Array.isArray(board) ? board : [];

    const sorted = useMemo(() => {
        const arr = [...safeBoard];
        arr.sort((a, b) => {
            const pa = Number(a?.points ?? 0);
            const pb = Number(b?.points ?? 0);
            // tie-break: wins puis podiums (si dispo)
            const wa = Number(a?.wins ?? 0);
            const wb = Number(b?.wins ?? 0);
            const pda = Number(a?.podiums ?? 0);
            const pdb = Number(b?.podiums ?? 0);

            if (pb !== pa) return pb - pa;
            if (wb !== wa) return wb - wa;
            return pdb - pda;
        });
        return arr;
    }, [safeBoard]);

    const champion = sorted[0] || null;

    // Debug utile (tu peux enlever après)
   console.log("[WDC] open", open, "boardLen", safeBoard.length, "sortedLen", sorted.length);

    return (
        <Modal
            open={open}
            title="WDC — Classement final"
            onClose={onClose}
            maxWidth="max-w-4xl"
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
            {/* Si le board est vide, on l’affiche clairement (pas une modale vide) */}
            {sorted.length === 0 ? (
                <div className="text-gray-200">
                    <div className="font-bold mb-1">Aucun classement reçu.</div>
                    <div className="text-sm text-gray-400">
                        Vérifie que <code className="text-gray-300">driversBoard</code> est bien rempli avant d’ouvrir la modale.
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Champion */}
                    <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-4">
                        <div className="text-xs text-gray-400 mb-1">Champion</div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="font-extrabold text-white">
                                {champion?.name} {champion?.surname}{" "}
                                <span className="text-gray-400 font-semibold">({champion?.team})</span>
                            </div>
                            <div className="text-white font-black">
                                {Number(champion?.points ?? 0)} pts
                            </div>
                        </div>
                    </div>

                    {/* Classement */}
                    <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-4">
                        <div className="font-extrabold text-white mb-3">Classement</div>

                        <div className="flex flex-col gap-2">
                            {sorted.map((d, idx) => {
                                const rank = idx + 1;
                                const isPlayer = player ? isSameDriver(d, player) : false;

                                return (
                                    <div
                                        key={`${d?.surname ?? "x"}_${d?.number ?? idx}_${rank}`}
                                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                                            isPlayer
                                                ? "border-amber-400/40 bg-amber-500/10"
                                                : "border-gray-800 bg-gray-900/40"
                                        }`}
                                    >
                                        <div className="text-sm text-gray-200">
                                            <span className="font-bold">{rank}.</span>{" "}
                                            <span className="font-semibold">{d?.name} {d?.surname}</span>{" "}
                                            <span className="text-gray-500">({d?.team})</span>
                                            {d?.number != null && (
                                                <span className="text-gray-500"> • #{d.number}</span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-200 font-semibold whitespace-nowrap">
                                            {Number(d?.points ?? 0)} pts
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="text-xs text-gray-500">
                        Tie-break: points → wins → podiums.
                    </div>
                </div>
            )}
        </Modal>
    );
}