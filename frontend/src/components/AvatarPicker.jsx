// src/components/AvatarPicker.jsx
import React from "react";
import { apiFetch } from "../services/api";

const AVATARS = [
    "verstappen","leclerc","norris","hamilton","alonso","sainz","colapinto","stroll",
    "hadjar","albon","antonelli","piastri","bearman","hulkenberg","bortoleto","ocon",
    "lawson","russel",
];

export default function AvatarPicker({ onChanged }) {
    const base = import.meta.env.BASE_URL; // ex: "/F1-Manager-2026/"
    const fallback = `${base}avatars/default.jpg`;

    async function choose(key) {
        try {
            const res = await apiFetch("/api/auth/avatar/", {
                method: "POST",
                body: JSON.stringify({ avatar_key: key }),
            });

            if (res?.avatar_url) {
                // Si ton backend renvoie "/avatars/xxx.jpg", on le rend compatible GH Pages
                const url = res.avatar_url.startsWith("http")
                    ? res.avatar_url
                    : `${base}${res.avatar_url.replace(/^\//, "")}`;

                onChanged?.(url, res.avatar_key);
            }
        } catch (e) {
            console.error("Avatar change failed", e);
            alert("Impossible de changer l’avatar.");
        }
    }

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {AVATARS.map((k) => {
                const src = `${base}avatars/${k}.jpg`;
                return (
                    <button
                        key={k}
                        type="button"
                        onClick={() => choose(k)}
                        className="rounded-xl border border-gray-700 bg-gray-900/40 hover:bg-gray-800/60 p-2 transition"
                        title={k}
                    >
                        <img
                            src={src}
                            alt={k}
                            className="w-14 h-14 object-cover rounded-lg mx-auto"
                            onError={(e) => (e.currentTarget.src = fallback)}
                        />
                        <div className="mt-1 text-[11px] text-center text-gray-300">{k}</div>
                    </button>
                );
            })}
        </div>
    );
}