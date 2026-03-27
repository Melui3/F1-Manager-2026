import { useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { useGame } from "../context/GameContext";

const AVATARS = [
    "verstappen","leclerc","norris","hamilton","alonso","sainz","colapinto","stroll",
    "hadjar","albon","antonelli","piastri","bearman","hulkenberg","bortoleto","ocon",
    "lawson","russell",
];

export default function AvatarPicker() {
    const base = import.meta.env.BASE_URL || "/";
    const { applyAvatar } = useGame();
    const [broken, setBroken] = useState(() => new Set());

    const avatarItems = useMemo(
        () => AVATARS.map((k) => ({ key: k, src: `${base}avatars/${k}.jpg` })),
        [base]
    );

    async function choose(key) {
        try {
            const res = await apiFetch("/api/auth/avatar/", {
                method: "POST",
                body: JSON.stringify({ avatar_key: key }),
            });
            if (typeof applyAvatar === "function") {
                applyAvatar({ avatar_key: res?.avatar_key || key });
            }
        } catch (e) {
            console.error("Avatar change failed", e);
            alert("Impossible de changer l'avatar.");
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
                        className="rounded-xl border border-f1-border bg-f1-surface-2/60 hover:bg-f1-surface hover:border-f1-red/40 p-2 transition-all duration-150"
                        title={key}
                    >
                        {!isBroken && (
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
                        <div className="mt-1 text-[11px] text-center text-f1-silver capitalize">{key}</div>
                    </button>
                );
            })}
        </div>
    );
}
