import { useMemo, useState } from "react";
import { getDriverExtra, driverKey } from "../data/driverExtra";
import Button from "./ui/Button";

function cx(...arr) {
    return arr.filter(Boolean).join(" ");
}

function Chip({ children }) {
    return (
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-f1-border bg-f1-dark/60 text-f1-silver">
            {children}
        </span>
    );
}

function Section({ title, children }) {
    return (
        <div className="rounded-2xl border border-f1-border bg-f1-surface-2/30 p-4">
            <div className="f1-label mb-3">{title}</div>
            {children}
        </div>
    );
}

function Stat({ label, value }) {
    if (value === undefined || value === null) return null;
    return (
        <div className="rounded-xl border border-f1-border bg-f1-dark/50 p-3 text-center">
            <div className="text-[11px] text-f1-muted">{label}</div>
            <div className="font-f1-display text-xl font-black text-f1-white leading-none mt-1">{value}</div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-f1-muted">{label}</span>
            <span className="font-semibold text-f1-silver text-right">{value ?? "—"}</span>
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

    const photoSrc =
        surname && number !== ""
            ? `${base}drivers/${String(surname).toLowerCase()}_${number}.avif`
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
                "rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-f1-dark shadow-xl border",
                isSelected
                    ? "ring-2 ring-f1-red border-f1-red/40 scale-[1.01]"
                    : "border-f1-border hover:scale-[1.005] hover:border-f1-muted"
            )}
        >
            {/* Photo */}
            <div className="relative h-80 w-full overflow-hidden bg-f1-surface">
                {photoSrc ? (
                    <img
                        src={photoSrc}
                        alt={fullName}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        onError={(e) => { e.currentTarget.remove(); }}
                    />
                ) : null}

                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
                    <div className="text-f1-white">
                        <div className="flex items-end justify-between gap-3">
                            <div className="font-f1-display text-3xl font-black leading-none text-f1-red">
                                #{number}
                            </div>
                            <div className="flex flex-wrap justify-end gap-1.5">
                                <Chip>{country}</Chip>
                                {extra?.role && <Chip>{extra.role}</Chip>}
                                {age2026 != null && <Chip>{age2026} ans</Chip>}
                                {key && <Chip>{key}</Chip>}
                            </div>
                        </div>

                        <div className="font-f1-display text-lg font-bold uppercase mt-1 tracking-wide">
                            {fullName}
                        </div>
                        <div className="text-sm text-f1-silver mt-0.5">{team}</div>

                        {extra?.style && extra.style !== "—" && (
                            <div className="mt-2 text-sm text-f1-silver">
                                <span className="text-f1-muted">Style : </span>
                                {extra.style}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toggle détails */}
            <button
                type="button"
                className="w-full bg-f1-surface text-f1-red py-2.5 text-sm hover:bg-f1-surface-2 border-t border-f1-border font-semibold transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails((v) => !v);
                }}
            >
                {showDetails ? "Masquer détails" : "Voir détails"}
            </button>

            {/* Détails */}
            {showDetails && (
                <div className="p-4 bg-f1-dark border-t border-f1-border space-y-3 f1-fade-in">
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
                                <div className="flex flex-wrap gap-1.5">
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
                                        <div className="f1-label mb-1">Forces</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {strengths.map((x, i) => (
                                                <Chip key={i}>{x}</Chip>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {weaknesses.length ? (
                                    <div>
                                        <div className="f1-label mb-1">Faiblesses</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {weaknesses.map((x, i) => (
                                                <Chip key={i}>{x}</Chip>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {notes.length ? (
                                    <div>
                                        <div className="f1-label mb-1">Notes</div>
                                        <ul className="list-disc pl-5 text-f1-silver text-sm space-y-1">
                                            {notes.map((x, i) => <li key={i}>{x}</li>)}
                                        </ul>
                                    </div>
                                ) : null}

                                {funFacts.length ? (
                                    <div>
                                        <div className="f1-label mb-1">Fun facts</div>
                                        <ul className="list-disc pl-5 text-f1-silver text-sm space-y-1">
                                            {funFacts.map((x, i) => <li key={i}>{x}</li>)}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        </Section>
                    ) : (
                        <div className="rounded-2xl border border-f1-border bg-f1-surface-2/20 p-4 text-sm text-f1-silver">
                            Profil manuel vide. Ajoute des champs dans <b>driverExtra.js</b> (traits/strengths/notes…).
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
