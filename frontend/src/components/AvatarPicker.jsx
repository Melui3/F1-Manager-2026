import React, { useMemo, useState } from "react";
import { apiFetch } from "../services/api";

const AVATARS = [
    "verstappen","leclerc","norris","hamilton","alonso","sainz","colapinto","stroll",
    "hadjar","albon","antonelli","piastri","bearman","hulkenberg","bortoleto","ocon",
    "lawson","russel",
];

export default function AvatarPicker({ onChanged }) {
    const base = import.meta.env.BASE_URL; // "/F1-Manager-2026/"
    const [broken, setBroken] = useState(() => new Set());

    const avatarItems = useMemo(() => {
        return AVATARS.map((k) => ({
            key: k,
            src: `${base}avatars/${k}.jpg`, // ⚠️ si tes fichiers sont .png, change ici.
        }));
    }, [base]);

    async function choose(key) {
        try {
            const res = await apiFetch("/api/auth/avatar/", {
                method: "POST",
                body: JSON.stringify({ avatar_key: key }),
            });

            if (res?.avatar_url) {
                const url = String(res.avatar_url).startsWith("http")
                    ? String(res.avatar_url)
                    : `${base}${String(res.avatar_url).replace(/^\//, "")}`;

                onChanged?.(url, res.avatar_key);
            }
        } catch (e) {
            console.error("Avatar change failed", e);
            alert("Impossible de changer l’avatar.");
        }
    }

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {avatarItems.map(({ key, src }) => {
                const isBroken = broken.has(key);

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => choose(key)}
                        className="rounded-xl border border-gray-700 bg-gray-900/40 hover:bg-gray-800/60 p-2 transition"
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

                        <div className="mt-1 text-[11px] text-center text-gray-300">{key}</div>
                    </button>
                );
            })}
        </div>
    );
}