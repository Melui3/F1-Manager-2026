import React, { useMemo, useState } from "react";
import { getDriverExtra, driverKey } from "../data/driverExtra";

function cx(...arr) {
    return arr.filter(Boolean).join(" ");
}

function Chip({ children }) {
    return (
        <span className="text-[11px] px-2 py-1 rounded-full border border-gray-600 bg-gray-900/30 text-gray-200">
      {children}
    </span>
    );
}

function Section({ title, children }) {
    return (
        <div className="rounded-2xl border border-gray-700 bg-gray-800/35 p-4">
            <div className="text-xs text-gray-400 mb-3">{title}</div>
            {children}
        </div>
    );
}

function Stat({ label, value }) {
    if (value === undefined || value === null) return null;
    return (
        <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-3 text-center">
            <div className="text-[11px] text-gray-400">{label}</div>
            <div className="text-xl font-black text-white leading-none mt-1">{value}</div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-gray-200 text-right">{value ?? "—"}</span>
        </div>
    );
}

function listToChips(arr) {
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
}

export default function DriverCard({ driver, isSelected, onSelect }) {
    const [showDetails, setShowDetails] = useState(false);

    const base = import.meta.env.BASE_URL;

    const surname = driver?.surname ?? "";
    const name = driver?.name ?? "";
    const number = driver?.number ?? "";
    const team = driver?.team ?? "—";
    const country = driver?.country ?? "—";

    const fullName = `${name} ${surname}`.trim() || "Pilote";
    const key = useMemo(() => driverKey(driver), [driver]);
    const extra = useMemo(() => getDriverExtra(driver), [driver]);

    // ✅ GH Pages safe + ✅ no default image
    const photoSrc =
        surname && number !== ""
            ? `${base}drivers/${surname.toLowerCase()}_${number}.avif`
            : null;

    const age2026 = useMemo(() => {
        const by = extra?.birthYear;
        return by ? 2026 - by : null;
    }, [extra]);

    const coreStats = [
        { label: "Vitesse", value: driver?.speed },
        { label: "Course", value: driver?.racing },
        { label: "Réaction", value: driver?.reaction },
        { label: "Exp.", value: driver?.experience },
    ];
    const consistencyStats = [
        { label: "Constance", value: driver?.consistency },
        { label: "Erreurs", value: driver?.error_rate },
    ];
    const affinityStats = [
        { label: "Street", value: driver?.street_circuit_affinity },
        { label: "High", value: driver?.high_speed_circuit_affinity },
        { label: "Pluie", value: driver?.wet_circuit_affinity },
    ];

    const traits = listToChips(extra?.traits);
    const strengths = listToChips(extra?.strengths);
    const weaknesses = listToChips(extra?.weaknesses);
    const notes = Array.isArray(extra?.notes) ? extra.notes.filter(Boolean) : [];
    const funFacts = Array.isArray(extra?.funFacts) ? extra.funFacts.filter(Boolean) : [];

    const hasManual =
        !!extra &&
        (traits.length || strengths.length || weaknesses.length || notes.length || funFacts.length || extra.style);

    const handleSelect = () => {
        if (typeof onSelect === "function") onSelect(driver);
    };

    return (
        <div
            onClick={handleSelect}
            className={cx(
                "rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-gray-900 shadow-xl border",
                isSelected ? "ring-4 ring-red-500 border-red-500/40 scale-[1.01]" : "border-gray-800 hover:scale-[1.005]"
            )}
        >
            {/* IMAGE (optional) */}
            <div className="relative h-80 w-full overflow-hidden bg-gray-950">
                {photoSrc ? (
                    <img
                        src={photoSrc}
                        alt={fullName}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        onError={(e) => {
                            // ✅ if missing, remove image (no fallback)
                            e.currentTarget.remove();
                        }}
                    />
                ) : null}

                {/* overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4">
                    <div className="text-white">
                        <div className="flex items-end justify-between gap-3">
                            <div className="text-3xl font-black leading-none">#{number}</div>

                            <div className="flex flex-wrap justify-end gap-2">
                                <Chip>{country}</Chip>
                                {extra?.role && <Chip>{extra.role}</Chip>}
                                {age2026 != null && <Chip>{age2026} ans (2026)</Chip>}
                                {key && <Chip>{key}</Chip>}
                            </div>
                        </div>

                        <div className="text-xl font-extrabold uppercase mt-1">{fullName}</div>
                        <div className="text-sm text-gray-300">{team}</div>

                        {extra?.style && extra.style !== "—" && (
                            <div className="mt-2 text-sm text-gray-200">
                                <span className="text-gray-400">Style : </span>
                                {extra.style}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toggle */}
            <button
                type="button"
                className="w-full bg-gray-800 text-red-400 py-2.5 text-sm hover:bg-gray-700 border-t border-gray-700 font-semibold"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails((v) => !v);
                }}
            >
                {showDetails ? "Masquer détails" : "Voir détails"}
            </button>

            {/* DETAILS */}
            {showDetails && (
                <div className="p-4 bg-gray-900 border-t border-gray-800 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Section title="Infos">
                            <div className="space-y-1.5 text-sm">
                                <Row label="Pays" value={country} />
                                <Row label="Numéro" value={number !== "" ? `#${number}` : "—"} />
                                {extra?.birthYear && <Row label="Naissance" value={extra.birthYear} />}
                                {extra?.displayName && <Row label="Nom (manuel)" value={extra.displayName} />}
                            </div>
                        </Section>

                        {traits.length ? (
                            <Section title="Tags">
                                <div className="flex flex-wrap gap-2">
                                    {traits.slice(0, 10).map((t, i) => (
                                        <Chip key={i}>{t}</Chip>
                                    ))}
                                </div>
                            </Section>
                        ) : null}
                    </div>

                    <Section title="Stats (backend)">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {coreStats.map((s) => (
                                <Stat key={s.label} label={s.label} value={s.value} />
                            ))}
                        </div>

                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {consistencyStats.map((s) => (
                                <Stat key={s.label} label={s.label} value={s.value} />
                            ))}
                            {affinityStats.map((s) => (
                                <Stat key={s.label} label={s.label} value={s.value} />
                            ))}
                        </div>
                    </Section>

                    {hasManual ? (
                        <Section title="Profil (manuel)">
                            <div className="space-y-3">
                                {strengths.length ? (
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Forces</div>
                                        <div className="flex flex-wrap gap-2">
                                            {strengths.map((x, i) => (
                                                <Chip key={i}>{x}</Chip>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {weaknesses.length ? (
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Faiblesses</div>
                                        <div className="flex flex-wrap gap-2">
                                            {weaknesses.map((x, i) => (
                                                <Chip key={i}>{x}</Chip>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {notes.length ? (
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Notes</div>
                                        <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
                                            {notes.map((x, i) => (
                                                <li key={i}>{x}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {funFacts.length ? (
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Fun facts</div>
                                        <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
                                            {funFacts.map((x, i) => (
                                                <li key={i}>{x}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        </Section>
                    ) : (
                        <div className="rounded-2xl border border-gray-800 bg-gray-800/20 p-4 text-sm text-gray-300">
                            Profil manuel vide. Ajoute des champs dans <b>driverExtra.js</b> (traits/strengths/notes…) et ça remplira direct.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}