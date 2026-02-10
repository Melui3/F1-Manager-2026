import React, { useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { useGame } from "../context/GameContext";

const AVATARS = [
    "verstappen","leclerc","norris","hamilton","alonso","sainz","colapinto","stroll",
    "hadjar","albon","antonelli","piastri","bearman","hulkenberg","bortoleto","ocon",
    "lawson","russell", // ✅ corrige "russel"
];

export default function AvatarPicker({ onChanged }) {
    const base = import.meta.env.BASE_URL || "/";
    const { accessToken, applyAvatar } = useGame();

    const [broken, setBroken] = useState(() => new Set());
    const [savingKey, setSavingKey] = useState(null);

    const avatarItems = useMemo(() => {
        return AVATARS.map((k) => ({
            key: k,
            src: `${base}avatars/${k}.jpg`, // change l'extension si besoin
        }));
    }, [base]);

    async function choose(key) {
        try {
            setSavingKey(key);

            const res = await apiFetch("/api/auth/avatar/", {
                method: "POST",
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                body: JSON.stringify({ avatar_key: key }),
            });

            // Attendu: { avatar_key, avatar_url } (ou au moins avatar_key)
            applyAvatar({
                avatar_key: res?.avatar_key || key,
                avatar_url: res?.avatar_url || null,
            });

            // compat avec ton code existant
            if (onChanged) {
                const url =
                    res?.avatar_url
                        ? (String(res.avatar_url).startsWith("http")
                            ? String(res.avatar_url)
                            : `${base}${String(res.avatar_url).replace(/^\//, "")}`)
                        : `${base}avatars/${key}.jpg`;

                onChanged(url, res?.avatar_key || key);
            }
        } catch (e) {
            console.error("Avatar change failed", e);
            alert("Impossible de changer l’avatar.");
        } finally {
            setSavingKey(null);
        }
    }

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {avatarItems.map(({ key, src }) => {
                const isBroken = broken.has(key);
                const isSaving = savingKey === key;

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => choose(key)}
                        disabled={!!savingKey}
                        className="rounded-xl border border-gray-700 bg-gray-900/40 hover:bg-gray-800/60 p-2 transition disabled:opacity-50"
                        title={key}
                    >
                        {isBroken ? (
                            <div className="w-14 h-14 rounded-lg mx-auto border border-gray-700 bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-200">
                                {key.slice(0, 3).toUpperCase()}
                            </div>
                        ) : (
                            <img
                                src={src}
                                alt={key}
                                className="w-14 h-14 object-cover rounded-lg mx-auto"
                                onError={() => {
                                    setBroken((prev) => {
                                        const next = new Set(prev);
                                        next.add(key);
                                        return next;
                                    });
                                }}
                            />
                        )}

                        <div className="mt-1 text-[11px] text-center text-gray-300">
                            {isSaving ? "..." : key}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}